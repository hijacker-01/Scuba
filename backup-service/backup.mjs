import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { snapshot } from './snapshot.mjs';
import { encryptBackup, encryptionKey } from './crypto.mjs';
import { keyringSetting, readKeys } from './keyring.mjs';
import { storage, uploadVerified } from './storage.mjs';
let mongo, s3;
try {
  const root = encryptionKey(process.env.BACKUP_ENCRYPTION_KEY);
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) throw new Error('MongoDB configuration missing');
  s3 = storage();
  mongo = await new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 90000 }).connect();
  const ring = readKeys(await mongo.db(process.env.MONGODB_DB).collection('settings').findOne({ key: keyringSetting }), root);
  const active = ring.keys.find(entry => entry.id === ring.activeId);
  const dump = await snapshot(mongo, process.env.MONGODB_DB);
  const object = `havelock-backups/${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.hdcbk`;
  await uploadVerified(s3, process.env.BACKUP_BUCKET, object, encryptBackup(dump.bytes, active.key));
  console.log(JSON.stringify({ event: 'backup_verified', object, keyId: active.id, collections: dump.collections, records: dump.records, at: new Date().toISOString() }));
  if (process.argv.includes('--download-link')) {
    try {
      const { createDownloadLink } = await import('./download-link.mjs');
      console.log(JSON.stringify(await createDownloadLink(s3, process.env.BACKUP_BUCKET, object)));
    } catch {
      console.error(JSON.stringify({ event: 'download_link_failed', message: 'Backup is verified, but its temporary download link could not be generated.' }));
    }
  }
} catch {
  // Never log provider or database errors, which may contain credentials or customer data.
  console.error(JSON.stringify({ event: 'backup_failed', message: 'Check private backup configuration, storage permissions, database access and the 50 MiB limit.' }));
  process.exitCode = 1;
} finally { if (mongo) await mongo.close(); s3?.destroy(); }
