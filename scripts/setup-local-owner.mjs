import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';
const connection = JSON.parse(await readFile('.codex/local/connection.json', 'utf8'));
const email = (process.argv[2] || 'owner@havelock.local').toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !connection.uri.startsWith('mongodb://127.0.0.1:27019/')) throw new Error('Invalid local owner configuration');
const client = await MongoClient.connect(connection.uri);
try {
  const db = client.db('havelock_local');
  const existing = await db.collection('staff').findOne({ email });
  if (!existing) {
    const password = randomBytes(24).toString('base64url');
    await db.collection('staff').createIndex({ email: 1 }, { unique: true });
    await db.collection('staff').insertOne({ email, passwordHash: await hash(password, 12), role: 'owner', active: true, sessionVersion: 1, createdAt: new Date() });
    await writeFile('.codex/local/owner-login.txt', `LOCAL DEVELOPMENT ONLY\nLogin: http://localhost:3000/admin/login\nEmail: ${email}\nPassword: ${password}\n\nThis is a laptop-only account. Provision a separate club-owned account on production.\n`);
  }
  let env = await readFile('.env.local', 'utf8');
  env = env.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${connection.uri}`).replace(/^MONGODB_DB=.*$/m, 'MONGODB_DB=havelock_local');
  if (!/^APP_URL=/m.test(env)) env += '\nAPP_URL=http://localhost:3000\n';
  await writeFile('.env.local', env);
  console.log('Local owner account ready. Credentials are saved privately in .codex/local/owner-login.txt.');
} finally { await client.close(); }
