import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { hash } from './crypto.mjs';
export function storage() {
  for (const key of ['BACKUP_BUCKET', 'BACKUP_ENDPOINT', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) if (!process.env[key]) throw new Error('Backup storage configuration missing');
  const endpoint = new URL(process.env.BACKUP_ENDPOINT);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Backup storage requires an HTTPS endpoint');
  return new S3Client({ endpoint: endpoint.href, region: process.env.AWS_REGION || 'auto', forcePathStyle: process.env.BACKUP_PATH_STYLE === 'true', maxAttempts: 3, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
}
export async function uploadVerified(s3, bucket, key, bytes) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: 'application/octet-stream', Metadata: { sha256: hash(bytes), format: 'hdcbk001' } }));
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const stored = Buffer.from(await response.Body.transformToByteArray());
  if (hash(stored) !== hash(bytes)) throw new Error('Uploaded backup verification failed');
}
export async function download(s3, bucket, key) {
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = Buffer.from(await response.Body.transformToByteArray());
  if (response.Metadata?.sha256 && hash(bytes) !== response.Metadata.sha256) throw new Error('Stored backup checksum differs');
  return bytes;
}
