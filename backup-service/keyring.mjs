import { randomBytes } from 'node:crypto';
import { decrypt, encrypt, encryptionKey, keyId } from './crypto.mjs';

export const keyringSetting = 'backup-encryption-keyring';
export function readKeys(stored, root) {
  if (!stored) return { activeId: keyId(root), keys: [{ id: keyId(root), key: root, createdAt: null }] };
  if (stored.format !== 1 || stored.rootId !== keyId(root) || !Array.isArray(stored.keys) || !stored.keys.length) throw new Error('Invalid backup keyring');
  const keys = stored.keys.map(entry => {
    const key = decrypt(Buffer.from(entry.wrapped, 'base64'), root);
    if (key.length !== 32 || keyId(key) !== entry.id) throw new Error('Invalid wrapped key');
    return { id: entry.id, key, createdAt: entry.createdAt };
  });
  if (new Set(keys.map(entry => entry.id)).size !== keys.length || !keys.some(entry => entry.id === stored.activeId) || !keys.some(entry => entry.id === keyId(root))) throw new Error('Incomplete backup keyring');
  return { activeId: stored.activeId, keys };
}
export function rotatedKeys(stored, root) {
  const previous = readKeys(stored, root);
  const key = randomBytes(32), id = keyId(key), createdAt = new Date().toISOString();
  const keys = [...previous.keys, { id, key, createdAt }];
  return { key: keyringSetting, format: 1, rootId: keyId(root), activeId: id, updatedAt: new Date(), keys: keys.map(entry => ({ id: entry.id, wrapped: encrypt(entry.key, root).toString('base64'), createdAt: entry.createdAt })) };
}
export function recoveryFile(stored, root) {
  const data = readKeys(stored, root);
  return { format: 'havelock-backup-recovery-v1', exportedAt: new Date().toISOString(), activeId: data.activeId, keys: data.keys.map(entry => ({ id: entry.id, key: entry.key.toString('hex'), createdAt: entry.createdAt })) };
}
export function parseRecoveryFile(value) {
  if (value?.format !== 'havelock-backup-recovery-v1' || !Array.isArray(value.keys) || !value.keys.length) throw new Error('Invalid recovery file');
  return value.keys.map(entry => {
    const key = encryptionKey(entry.key);
    if (keyId(key) !== entry.id) throw new Error('Invalid recovery key identifier');
    return key;
  });
}
