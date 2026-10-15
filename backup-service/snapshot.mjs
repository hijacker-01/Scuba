import { BSON } from 'mongodb';
import { gzipSync, gunzipSync } from 'node:zlib';
import { hash } from './crypto.mjs';
const ejson = value => BSON.EJSON.stringify(value, { relaxed: false });
const maxBytes = 50 * 1024 * 1024;
async function metadata(db) {
  const entries = await db.listCollections().toArray();
  if (entries.some(c => c.type !== 'collection' || Object.keys(c.options || {}).length)) throw new Error('Only ordinary collections are supported; review database backup tooling');
  const collections = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    collections.push({ name: entry.name, indexes: await db.collection(entry.name).listIndexes().toArray() });
  }
  return collections;
}
export async function snapshot(client, databaseName) {
  const db = client.db(databaseName), before = await metadata(db), session = client.startSession();
  let collections;
  try {
    await session.withTransaction(async () => {
      collections = []; let total = 0;
      for (const collection of before) {
        const documents = [];
        for await (const doc of db.collection(collection.name).find({}, { session }).sort({ _id: 1 })) {
          total += Buffer.byteLength(ejson(doc));
          if (total > maxBytes) throw new Error('Database exceeds 50 MiB snapshot limit; migrate to streaming database tools');
          documents.push(doc);
        }
        collections.push({ ...collection, documents });
      }
    }, { readConcern: { level: 'snapshot' }, maxCommitTimeMS: 10000 });
  } finally { await session.endSession(); }
  if (ejson(before) !== ejson(await metadata(db))) throw new Error('Database schema changed during backup; run again');
  const value = { format: 1, createdAt: new Date(), database: databaseName, collections };
  return { bytes: gzipSync(ejson(value)), collections: collections.length, records: collections.reduce((n, c) => n + c.documents.length, 0) };
}
export function unpack(bytes) {
  const value = BSON.EJSON.parse(gunzipSync(bytes, { maxOutputLength: maxBytes * 3 }).toString(), { relaxed: false });
  if (Number(value.format) !== 1 || !Array.isArray(value.collections) || typeof value.database !== 'string') throw new Error('Invalid snapshot format');
  return value;
}
export async function restoreAndVerify(client, name, snapshot) {
  if (!/^havelock_restore_verify_[a-f\d]{32}$/.test(name)) throw new Error('Restore is restricted to a disposable verification database');
  if ((await client.db('admin').admin().listDatabases()).databases.some(db => db.name === name)) throw new Error('Verification database already exists');
  const db = client.db(name);
  let created = false;
  try {
    for (const collection of snapshot.collections) {
      await db.createCollection(collection.name); created = true;
      if (collection.documents.length) await db.collection(collection.name).insertMany(collection.documents);
      for (const index of collection.indexes.filter(i => i.name !== '_id_')) {
        const { key, v, ns, ...options } = index;
        void v; void ns;
        await db.collection(collection.name).createIndex(key, options);
      }
      const restored = await db.collection(collection.name).find().sort({ _id: 1 }).toArray();
      if (hash(ejson(restored)) !== hash(ejson(collection.documents))) throw new Error('Restored record hash mismatch');
      const expected = collection.indexes.map(({ v, ns, ...i }) => { void v; void ns; return i; });
      const actual = (await db.collection(collection.name).listIndexes().toArray()).map(({ v, ns, ...i }) => { void v; void ns; return i; });
      if (ejson(expected) !== ejson(actual)) throw new Error('Restored indexes differ');
    }
    return snapshot.collections.length;
  } finally { if (created) await db.dropDatabase(); }
}
