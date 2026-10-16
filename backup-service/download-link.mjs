import { ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { pathToFileURL } from 'node:url';
import { storage } from './storage.mjs';

const backupKey = /^havelock-backups\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9-]{36}\.hdcbk$/;

export async function createDownloadLink(s3, bucket, object) {
  if (!object) {
    let token;
    do {
      const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'havelock-backups/', ContinuationToken: token }));
      for (const item of page.Contents || []) {
        if (backupKey.test(item.Key || '') && (!object || item.Key > object)) object = item.Key;
      }
      if (page.IsTruncated && (!page.NextContinuationToken || page.NextContinuationToken === token)) throw new Error('Incomplete backup listing');
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  }
  if (!backupKey.test(object || '')) throw new Error('No valid backup found');
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: object }));
  if (!['hdcbk001', 'hdcbk002'].includes(head.Metadata?.format) || !head.ContentLength) throw new Error('Invalid backup object');
  const expiresIn = 600;
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucket, Key: object,
    ResponseContentType: 'application/octet-stream',
    ResponseContentDisposition: `attachment; filename="${object.split('/').pop()}"`,
  }), { expiresIn });
  return { event: 'backup_download_link', object, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(), url };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let s3;
  try {
    s3 = storage();
    console.log(JSON.stringify(await createDownloadLink(s3, process.env.BACKUP_BUCKET, process.env.BACKUP_OBJECT_KEY)));
  } catch {
    console.error(JSON.stringify({ event: 'download_link_failed', message: 'Check private storage configuration, bucket read/list permissions and backup object.' }));
    process.exitCode = 1;
  } finally { s3?.destroy(); }
}
