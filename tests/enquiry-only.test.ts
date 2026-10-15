import { afterEach, expect, it, vi } from 'vitest';
import { POST as reserve } from '../app/api/bookings/route';
import { POST as createOrder } from '../app/api/payment/create-order/route';
import { POST as verifyPayment } from '../app/api/payment/verify-payment/route';
import { POST as recover } from '../app/api/bookings/recover/route';
import { POST as webhook } from '../app/api/payment/webhook/route';
import { POST as reconcile } from '../app/api/internal/reconcile/route';
afterEach(() => vi.unstubAllEnvs());
it('rejects legacy reservation and payment requests without touching a gateway or database', async () => {
  for (const handler of [reserve, createOrder, verifyPayment, webhook, recover]) {
    const result = await handler();
    expect(result.status).toBe(410);
    expect((await result.json()).error.code).toBe('ENQUIRY_ONLY');
  }
});
it('keeps old reconciliation workers compatible but still requires authentication', async () => {
  vi.stubEnv('CRON_SECRET', 'worker-test-secret');
  expect((await reconcile(new Request('https://club.test/api/internal/reconcile', { method: 'POST' }))).status).toBe(401);
  const result = await reconcile(new Request('https://club.test/api/internal/reconcile', { method: 'POST', headers: { authorization: 'Bearer worker-test-secret' } }));
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ skipped: true, reason: 'enquiry_only' });
});
