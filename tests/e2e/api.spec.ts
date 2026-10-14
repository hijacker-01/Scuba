import { test, expect } from '@playwright/test';

test('public API rejects malformed and tampered input', async ({ request }) => {
  const headers = { 'Idempotency-Key': 'test-validation-key-12345' };
  const invalidJson = await request.post('/api/bookings', { headers: { ...headers, 'Content-Type': 'application/json' }, data: '{' });
  expect(invalidJson.status()).toBe(400);
  const tampered = await request.post('/api/bookings', { headers, data: { slotId: 'a'.repeat(24), participants: 1, name: 'Test Diver', email: 'diver@example.com', phone: '1234567890', amount: 1, status: 'confirmed' } });
  expect(tampered.status()).toBe(400);
  const enquiry = await request.post('/api/enquiries', { data: {} });
  expect(enquiry.status()).toBe(400);
});

test('private routes require a session', async ({ request }) => {
  expect((await request.get('/api/admin/overview')).status()).toBe(401);
  expect((await request.get('/api/bookings/00000000-0000-0000-0000-000000000000')).status()).toBe(401);
});
