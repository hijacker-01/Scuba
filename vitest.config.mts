import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({ resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }, test: { include: ['tests/*.test.ts'], exclude: process.env.RUN_DB_TESTS === '1' ? [] : ['tests/reservation.test.ts', 'tests/management.test.ts'], environment: 'node' } });
