import test from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';
import { createDownloadLink } from './download-link.mjs';

const first = 'havelock-backups/2026-10-15T20-01-20-578Z-7fe3d3b7-2be6-4d58-b884-9c932c7049d5.hdcbk';
const latest = first.replace('20-01-20', '21-01-20');
function client(send) {
  const s3 = new S3Client({ endpoint: 'https://storage.example.com', region: 'auto', credentials: { accessKeyId: 'test-access', secretAccessKey: 'test-secret' } });
  s3.send = send;
  return s3;
}
test('latest backup across pages gets a ten-minute attachment URL', async () => {
  const s3 = client(async command => {
    if (command.constructor.name === 'ListObjectsV2Command') {
      return command.input.ContinuationToken
        ? { Contents: [{ Key: latest }, { Key: 'havelock-backups/zz-unrelated.txt' }] }
        : { Contents: [{ Key: first }], IsTruncated: true, NextContinuationToken: 'page2' };
    }
    assert.equal(command.input.Key, latest);
    return { ContentLength: 1024, Metadata: { format: 'hdcbk001' } };
  });
  try {
    const result = await createDownloadLink(s3, 'test-bucket');
    assert.equal(result.object, latest);
    const url = new URL(result.url);
    assert.equal(url.searchParams.get('X-Amz-Expires'), '600');
    assert.equal(url.searchParams.get('response-content-disposition'), `attachment; filename="${latest.split('/').pop()}"`);
    assert.equal(url.searchParams.get('response-content-type'), 'application/octet-stream');
    assert.ok(url.searchParams.get('X-Amz-Signature'));
    assert.ok(!result.url.includes('test-secret'));
  } finally { s3.destroy(); }
});
test('refuses unrelated keys and unmarked objects', async () => {
  const s3 = client(async () => ({ ContentLength: 1024, Metadata: {} }));
  try {
    await assert.rejects(createDownloadLink(s3, 'test-bucket', '../customer.csv'));
    await assert.rejects(createDownloadLink(s3, 'test-bucket', first));
  } finally { s3.destroy(); }
});
test('fails on incomplete pagination instead of choosing an older backup', async () => {
  const s3 = client(async () => ({ Contents: [{ Key: first }], IsTruncated: true }));
  try { await assert.rejects(createDownloadLink(s3, 'test-bucket')); }
  finally { s3.destroy(); }
});
