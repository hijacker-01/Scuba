import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
const magic = Buffer.from('HDCBK001');
export function encryptionKey(value) {
  if (!/^[a-f\d]{64}$/i.test(value || '')) throw new Error('BACKUP_ENCRYPTION_KEY must be 64 hex characters');
  return Buffer.from(value, 'hex');
}
export function encrypt(bytes, key) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(magic);
  const body = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([magic, iv, cipher.getAuthTag(), body]);
}
export function decrypt(bytes, key) {
  if (bytes.length < 36 || !bytes.subarray(0, 8).equals(magic)) throw new Error('Invalid backup envelope');
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(8, 20));
  cipher.setAAD(magic); cipher.setAuthTag(bytes.subarray(20, 36));
  return Buffer.concat([cipher.update(bytes.subarray(36)), cipher.final()]);
}
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const keyId = key => hash(key).slice(0, 32);
const versionedMagic = Buffer.from('HDCBK002');
export function encryptBackup(bytes, key) {
  const header = Buffer.concat([versionedMagic, Buffer.from(keyId(key), 'hex')]);
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(header);
  const body = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([header, iv, cipher.getAuthTag(), body]);
}
export function decryptBackup(bytes, keys) {
  if (bytes.subarray(0, 8).equals(magic)) {
    for (const key of keys) { try { return decrypt(bytes, key); } catch {} }
    throw new Error('Legacy recovery key unavailable');
  }
  if (bytes.length < 52 || !bytes.subarray(0, 8).equals(versionedMagic)) throw new Error('Invalid backup envelope');
  const id = bytes.subarray(8, 24).toString('hex'), key = keys.find(candidate => keyId(candidate) === id);
  if (!key) throw new Error('Matching recovery key unavailable');
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(24, 36));
  cipher.setAAD(bytes.subarray(0, 24)); cipher.setAuthTag(bytes.subarray(36, 52));
  return Buffer.concat([cipher.update(bytes.subarray(52)), cipher.final()]);
}
