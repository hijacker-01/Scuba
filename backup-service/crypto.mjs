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
