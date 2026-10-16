import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { compare, hash } from 'bcryptjs';
import { encrypt, encryptBackup, decryptBackup, encryptionKey } from '../backup-service/crypto.mjs';
import { parseRecoveryFile, readKeys } from '../backup-service/keyring.mjs';
const state = vi.hoisted(() => ({ cookie: 'security-session' }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.cookie ? { value: state.cookie } : undefined }) }));
let server: MongoMemoryReplSet, db: Awaited<ReturnType<typeof import('../lib/db').database>>;
const password = 'current-test-passphrase';
const root = encryptionKey('ab'.repeat(32));
const request = (body: unknown, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/admin/security', { method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body) });
beforeAll(async () => {
  server = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 }, instanceOpts: [{ args: ['--nounixsocket', '--setParameter', 'diagnosticDataCollectionEnabled=false'] }] });
  Object.assign(process.env, { MONGODB_URI: server.getUri(), MONGODB_DB: 'account_security_test', APP_URL: 'http://localhost:3000', BACKUP_ENCRYPTION_KEY: root.toString('hex') });
  db = await (await import('../lib/db')).database();
}, 120000);
beforeEach(async () => {
  for (const collection of await db.listCollections().toArray()) await db.collection(collection.name).deleteMany({});
  state.cookie = 'security-session';
  const staff = await db.collection('staff').insertOne({ email: 'owner@example.com', passwordHash: await hash(password, 4), active: true, role: 'owner', sessionVersion: 0 });
  const { tokenHash } = await import('../lib/auth');
  await db.collection('staff_sessions').insertMany(['security-session', 'another-session'].map(token => ({ staffId: staff.insertedId, tokenHash: tokenHash(token), sessionVersion: 0, expiresAt: new Date(Date.now() + 600000) })));
});
afterAll(async () => { await server?.stop(); });
describe('account password and backup keys', () => {
  it('changes only the signed-in account password and revokes every session', async () => {
    const { POST } = await import('../app/api/admin/password/route');
    const other = await db.collection('staff').insertOne({ email: 'other@example.com', active: true, passwordHash: 'unchanged' });
    const next = 'new-owner-memorable-passphrase';
    const response = await POST(request({ currentPassword: password, newPassword: next, confirmPassword: next }));
    expect(response.status).toBe(200);
    const staff = await db.collection('staff').findOne({ email: 'owner@example.com' });
    expect(await compare(next, staff!.passwordHash)).toBe(true);
    expect(await compare(password, staff!.passwordHash)).toBe(false);
    expect(await db.collection('staff_sessions').countDocuments()).toBe(0);
    expect((await db.collection('staff').findOne({ _id: other.insertedId }))?.passwordHash).toBe('unchanged');
    expect(response.headers.get('set-cookie')).toContain('staff_session=');
    const { POST: login } = await import('../app/api/admin/login/route');
    expect((await login(request({ email: 'owner@example.com', password }))).status).toBe(401);
    expect((await login(request({ email: 'owner@example.com', password: next }))).status).toBe(200);
  });
  it('rejects wrong current passwords, mismatches, cross-origin and bcrypt truncation', async () => {
    const { POST } = await import('../app/api/admin/password/route');
    const next = 'another-valid-passphrase';
    expect((await POST(request({ currentPassword: 'incorrect', newPassword: next, confirmPassword: next }))).status).toBe(401);
    expect((await POST(request({ currentPassword: password, newPassword: next, confirmPassword: password }))).status).toBe(400);
    expect((await POST(request({ currentPassword: password, newPassword: next, confirmPassword: next }, 'https://attacker.example'))).status).toBe(403);
    expect((await POST(request({ currentPassword: password, newPassword: 'é'.repeat(40), confirmPassword: 'é'.repeat(40) }))).status).toBe(400);
    expect(await db.collection('staff_sessions').countDocuments()).toBe(2);
  });
  it('requires authentication and rate-limits password guesses for the account', async () => {
    const { POST } = await import('../app/api/admin/password/route');
    const body = { currentPassword: 'incorrect', newPassword: 'another-valid-passphrase', confirmPassword: 'another-valid-passphrase' };
    state.cookie = ''; expect((await POST(request(body))).status).toBe(401); state.cookie = 'security-session';
    for (let i = 0; i < 5; i++) expect((await POST(request(body))).status).toBe(401);
    expect((await POST(request(body))).status).toBe(429);
  });
  it('restricts backup management to a reauthenticated owner', async () => {
    const { POST } = await import('../app/api/admin/backup-keys/route');
    expect((await POST(request({ currentPassword: 'incorrect', action: 'rotate' }))).status).toBe(401);
    await db.collection('staff').updateOne({ email: 'owner@example.com' }, { $set: { role: 'staff' } });
    expect((await POST(request({ currentPassword: password, action: 'export' }))).status).toBe(403);
    expect(await db.collection('settings').countDocuments()).toBe(0);
  });
  it('prevents the team-management form from bypassing self-password confirmation', async () => {
    const { PUT } = await import('../app/api/admin/staff/route');
    expect((await PUT(request({ email: 'owner@example.com', active: true, role: 'owner', password: 'unconfirmed-new-passphrase' }))).status).toBe(409);
    expect(await db.collection('staff_sessions').countDocuments()).toBe(2);
  });
  it('keeps legacy and both rotated backups recoverable without the live database', async () => {
    const { POST } = await import('../app/api/admin/backup-keys/route');
    const bytes = Buffer.from('test backup data'), old = encrypt(bytes, root);
    const firstResponse = await POST(request({ currentPassword: password, action: 'rotate' }));
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get('cache-control')).toContain('no-store');
    const first = await firstResponse.json(), key1 = parseRecoveryFile(first).find((key: Buffer) => !key.equals(root))!;
    const backup1 = encryptBackup(bytes, key1);
    const secondResponse = await POST(request({ currentPassword: password, action: 'rotate' }));
    expect(secondResponse.status).toBe(200);
    const second = await secondResponse.json(), keys = parseRecoveryFile(second);
    expect(keys).toHaveLength(3);
    const active = keys.find((key: Buffer) => !key.equals(root) && !key.equals(key1))!;
    const backup2 = encryptBackup(bytes, active);
    for (const backup of [old, backup1, backup2]) expect(decryptBackup(backup, keys).equals(bytes)).toBe(true);
    expect(() => decryptBackup(backup2, parseRecoveryFile(first))).toThrow();
    const stored = await db.collection('settings').findOne({ key: 'backup-encryption-keyring' });
    expect(readKeys(stored, root).activeId).toBe(second.activeId);
    const serialized = JSON.stringify(stored);
    for (const key of keys) expect(serialized).not.toContain(key.toString('hex'));
    const exported = await (await POST(request({ currentPassword: password, action: 'export' }))).json();
    expect(exported.activeId).toBe(second.activeId); expect(exported.keys).toHaveLength(3);
  });
  it('fails closed when the server wrapping key is changed', async () => {
    const { POST } = await import('../app/api/admin/backup-keys/route');
    expect((await POST(request({ currentPassword: password, action: 'rotate' }))).status).toBe(200);
    process.env.BACKUP_ENCRYPTION_KEY = 'cd'.repeat(32);
    expect((await POST(request({ currentPassword: password, action: 'rotate' }))).status).toBe(503);
    process.env.BACKUP_ENCRYPTION_KEY = root.toString('hex');
    expect(parseRecoveryFile(await (await POST(request({ currentPassword: password, action: 'export' }))).json())).toHaveLength(2);
  });
});
