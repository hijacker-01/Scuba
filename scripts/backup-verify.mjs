// Creates a BSON-preserving snapshot and verifies it in a disposable database.
import nextEnv from '@next/env';
import { MongoClient, BSON } from 'mongodb';
import { createHash, randomUUID } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.MONGODB_URI) throw new Error('Configure MongoDB first');
const client = await MongoClient.connect(process.env.MONGODB_URI);
const backupDirectory = resolve(process.argv[2] || '.codex/local/backups');
const verificationName = `havelock_restore_verify_${randomUUID().replaceAll('-', '')}`;
const session = client.startSession();
try {
  const source = client.db(process.env.MONGODB_DB || 'havelock_dive_club');
  const names = (await source.listCollections().toArray()).filter(c => c.type === 'collection').map(c => c.name);
  const collections = {};
  await session.withTransaction(async () => {
    for (const name of names) collections[name] = { documents: await source.collection(name).find({}, { session }).sort({ _id: 1 }).toArray() };
  }, { readConcern: { level: 'snapshot' } });
  for (const name of names) collections[name].indexes = await source.collection(name).listIndexes().toArray();
  await mkdir(backupDirectory, { recursive: true });
  const path = resolve(backupDirectory, `snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json.gz`);
  await writeFile(path, gzipSync(BSON.EJSON.stringify({ createdAt: new Date(), source: source.databaseName, collections }, { relaxed: false })));
  const snapshot = BSON.EJSON.parse(gunzipSync(await readFile(path)).toString(), { relaxed: false });
  const target = client.db(verificationName);
  const digest = documents => createHash('sha256').update(BSON.EJSON.stringify(documents, { relaxed: false })).digest('hex');
  for (const [name, content] of Object.entries(snapshot.collections)) {
    await target.createCollection(name);
    if (content.documents.length) await target.collection(name).insertMany(content.documents);
    for (const index of content.indexes.filter(i => i.name !== '_id_')) {
      const options = Object.fromEntries(['name', 'unique', 'sparse', 'expireAfterSeconds', 'partialFilterExpression'].filter(key => index[key] !== undefined).map(key => [key, index[key]]));
      await target.collection(name).createIndex(index.key, options);
    }
    if (digest(await target.collection(name).find().sort({ _id: 1 }).toArray()) !== digest(content.documents)) throw new Error(`Restore validation failed for ${name}`);
  }
  console.log(`Backup saved and restored successfully: ${names.length} collections verified. ${path}`);
} finally {
  if (!verificationName.startsWith('havelock_restore_verify_')) throw new Error('Refusing to clean an unexpected database');
  await client.db(verificationName).dropDatabase();
  await session.endSession(); await client.close();
}
