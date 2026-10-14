import { setTimeout as delay } from 'node:timers/promises';
const base = process.env.WORKER_APP_URL || process.env.APP_URL;
const secret = process.env.CRON_SECRET;
if (!base || !secret || /replace|placeholder/i.test(secret)) throw new Error('Worker URL and CRON_SECRET required');
const url = new URL(base);
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid worker URL');
let stopped = false;
const controller = new AbortController();
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { stopped = true; controller.abort(); });
async function loop(path, interval) {
  while (!stopped) {
    const started = Date.now();
    try {
      const response = await fetch(new URL(path, url), { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]), redirect: 'error' });
      await response.arrayBuffer();
      console.log(JSON.stringify({ job: path.split('/').pop(), status: response.status, at: new Date().toISOString() }));
    } catch {
      if (!stopped) console.error(JSON.stringify({ job: path.split('/').pop(), error: 'request_failed' }));
    }
    try { await delay(Math.max(1000, interval - (Date.now() - started)), undefined, { signal: controller.signal }); } catch { break; }
  }
}
await Promise.all([loop('/api/internal/notifications', 60000), loop('/api/internal/reconcile', 300000)]);
