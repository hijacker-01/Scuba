import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BSON } from 'mongodb';
import { gzipSync } from 'node:zlib';
import { encryptionKey, encrypt, decrypt } from './crypto.mjs';
import { unpack, restoreAndVerify } from './snapshot.mjs';
import { uploadVerified } from './storage.mjs';
const key = encryptionKey('ab'.repeat(32));
test('encrypted snapshots preserve BSON dates, ObjectIds and int64 values', () => {
  const doc = { _id: new BSON.ObjectId(), createdAt: new Date(), count: BSON.Long.fromString('9223372036854775800') };
  const snapshot = { format: 1, database: 'club', collections: [{ name: 'enquiries', indexes: [], documents: [doc] }] };
  const payload = gzipSync(BSON.EJSON.stringify(snapshot, { relaxed: false }));
  const encoded = encrypt(payload, key);
  assert.ok(!encoded.includes(Buffer.from('enquiries')));
  const restored = unpack(decrypt(encoded, key)).collections[0].documents[0];
  assert.equal(restored._id.toString(), doc._id.toString());
  assert.equal(restored.createdAt.toISOString(), doc.createdAt.toISOString());
  assert.equal(restored.count.toString(), doc.count.toString());
});
test('tampering and wrong encryption keys are rejected', () => {
  const encoded = encrypt(Buffer.from('private backup'), key);
  const damaged = Buffer.from(encoded); damaged[damaged.length - 1] ^= 1;
  assert.throws(() => decrypt(damaged, key));
  assert.throws(() => decrypt(encoded, encryptionKey('cd'.repeat(32))));
});
test('each encryption uses a fresh nonce', () => assert.notDeepEqual(encrypt(Buffer.from('same'), key), encrypt(Buffer.from('same'), key)));
test('invalid backup keys and formats are rejected', () => {
  assert.throws(() => encryptionKey('short'));
  assert.throws(() => decrypt(Buffer.from('invalid'), key));
  assert.throws(() => unpack(gzipSync('{}')));
});
test('restore cannot target the live database name', async () => {
  await assert.rejects(restoreAndVerify({}, 'havelock_dive_club_staging', {}), /disposable/);
});
test('storage success requires downloading the exact uploaded bytes', async () => {
  const bytes = Buffer.from('encrypted'); let calls = 0;
  const fake = { send: async command => { calls++; return command.constructor.name === 'PutObjectCommand' ? {} : { Body: { transformToByteArray: async () => bytes } }; } };
  await uploadVerified(fake, 'private', 'key', bytes); assert.equal(calls, 2);
});
test('a corrupted readback fails the backup job', async () => {
  const fake = { send: async command => command.constructor.name === 'PutObjectCommand' ? {} : { Body: { transformToByteArray: async () => Buffer.from('damaged') } } };
  await assert.rejects(uploadVerified(fake, 'private', 'key', Buffer.from('encrypted')), /verification failed/);
});
