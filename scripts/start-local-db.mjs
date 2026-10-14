// Development only: a persistent database bound to this laptop's loopback interface.
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const directory = resolve('.codex/local');
await mkdir(resolve(directory, 'database'), { recursive: true });
const server = await MongoMemoryReplSet.create({ instanceOpts: [{ port: 27019, dbPath: resolve(directory, 'database') }], replSet: { count: 1, name: 'hdc-local', ip: '127.0.0.1', storageEngine: 'wiredTiger' } });
await writeFile(resolve(directory, 'connection.json'), JSON.stringify({ uri: server.getUri(), pid: process.pid, mode: 'development', startedAt: new Date() }, null, 2));
console.log('Local development database ready on 127.0.0.1:27019.');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await server.stop({ doCleanup: false }); process.exit(0); });
await new Promise(() => {});
