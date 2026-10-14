import { afterEach, expect, it, vi } from 'vitest';
import { deliverEmail } from '../lib/email-delivery';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('sends HTTPS mail with stable retry key and monitored reply address', async () => {
  vi.stubEnv('EMAIL_PROVIDER', 'resend'); vi.stubEnv('RESEND_API_KEY', 'test-secret'); vi.stubEnv('EMAIL_FROM', 'Club <bookings@example.com>'); vi.stubEnv('EMAIL_REPLY_TO', 'club@example.com');
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'mail-id' }) }); vi.stubGlobal('fetch', request);
  await deliverEmail('job-1', 'customer@example.com', 'Confirmed', 'Booking details');
  await deliverEmail('job-1', 'customer@example.com', 'Confirmed', 'Booking details');
  expect(request.mock.calls[0][0]).toBe('https://api.resend.com/emails');
  expect(request.mock.calls[0][1].headers['Idempotency-Key']).toBe(request.mock.calls[1][1].headers['Idempotency-Key']);
  expect(JSON.parse(request.mock.calls[0][1].body).reply_to).toBe('club@example.com');
});
it('rejects provider failure so the queue can retry', async () => {
  vi.stubEnv('EMAIL_PROVIDER', 'resend'); vi.stubEnv('RESEND_API_KEY', 'test-secret'); vi.stubEnv('EMAIL_FROM', 'Club <bookings@example.com>');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  await expect(deliverEmail('job-2', 'customer@example.com', 'Confirmed', 'Details')).rejects.toThrow('Email API delivery failed');
});
