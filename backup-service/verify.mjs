import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { decryptBackup, encryptionKey } from './crypto.mjs';
import { parseRecoveryFile } from './keyring.mjs';
import { unpack, restoreAndVerify } from './snapshot.mjs';
import { storage, download } from './storage.mjs';
let mongo, s3;
try {
  if (!process.env.RESTORE_TEST_URI || process.env.RESTORE_TEST_URI === process.env.MONGODB_URI) throw new Error('Use an isolated verification MongoDB service');
  const object = process.env.BACKUP_OBJECT_KEY;
  if (!/^havelock-backups\/[\w.-]+\.hdcbk$/.test(object || '')) throw new Error('Choose a valid backup object');
  s3 = storage();
  const keys = process.env.BACKUP_RECOVERY_FILE
    ? parseRecoveryFile(JSON.parse(readFileSync(process.env.BACKUP_RECOVERY_FILE, 'utf8')))
    : [encryptionKey(process.env.BACKUP_ENCRYPTION_KEY)];
  const dump = unpack(decryptBackup(await download(s3, process.env.BACKUP_BUCKET, object), keys));
  mongo = await new MongoClient(process.env.RESTORE_TEST_URI, { serverSelectionTimeoutMS: 30000 }).connect();
  const count = await restoreAndVerify(mongo, `havelock_restore_verify_${randomUUID().replaceAll('-', '')}`, dump);
  console.log(JSON.stringify({ event: 'restore_verified', collections: count, object }));
} catch {
  console.error(JSON.stringify({ event: 'restore_verification_failed', message: 'Check the isolated test database, encryption key and selected backup.' }));
  process.exitCode = 1;
} finally { if (mongo) await mongo.close(); s3?.destroy(); }
