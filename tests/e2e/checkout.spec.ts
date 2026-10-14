import { expect, test } from '@playwright/test';
test('checkout requires terms and reuses its request key after a lost response', async ({ page }) => {
  const reference = '11111111-1111-4111-8111-111111111111', slotId = 'a'.repeat(24), version = 'c'.repeat(64);
  const keys: string[] = []; let orderAttempts = 0;
  await page.route('**/api/availability?*', route => route.fulfill({ json: { product: { name: 'Discover Scuba Diving', terms: 'Approved activity terms for this departure.', termsVersion: version }, slots: [{ id: slotId, startAt: '2030-10-20T04:00:00Z', endAt: '2030-10-20T06:00:00Z', pricePaise: 299900, seats: 8 }] } }));
  await page.route('**/api/bookings', async route => {
    keys.push(route.request().headers()['idempotency-key']);
    expect(route.request().postDataJSON()).toMatchObject({ acceptedTerms: true, termsVersion: version, slotId });
    if (keys.length === 1) await route.abort('failed');
    else await route.fulfill({ json: { booking: { reference, status: 'pending' } } });
  });
  await page.route('**/api/payment/create-order', route => { orderAttempts++; return route.fulfill({ status: 503, json: { error: { code: 'NOT_CONFIGURED', message: 'Payment setup is required.' } } }); });
  await page.goto('/book');
  await page.getByRole('combobox').nth(1).selectOption(slotId);
  await page.getByLabel('Full name').fill('Demo Diver'); await page.getByLabel('Email', { exact: true }).fill('demo@example.com'); await page.getByLabel('Phone', { exact: true }).fill('1234567890');
  const pay = page.getByRole('button', { name: 'Reserve and pay', exact: true });
  await expect(pay).toBeDisabled(); await expect(page.getByText('Approved activity terms for this departure.')).toBeVisible();
  await page.getByRole('checkbox', { name: 'I have read and accept these activity terms.' }).check();
  await pay.click(); await expect.poll(() => keys.length).toBe(1); await expect(pay).toBeEnabled();
  await pay.click(); await expect.poll(() => keys.length).toBe(2); await expect(page.getByRole('status')).toContainText('Payment setup is required');
  expect(keys[0]).toBe(keys[1]);
  const saved = await page.evaluate(() => localStorage.getItem('hdc.checkout.attempt'));
  expect(saved).toContain(reference); expect(saved).not.toContain('demo@example.com'); expect(saved).not.toContain('Demo Diver');
  await page.reload(); await expect(page.getByText(`Saved reservation: ${reference}`)).toBeVisible();
  await page.getByRole('button', { name: 'Resume payment', exact: true }).click(); await expect.poll(() => orderAttempts).toBe(2); expect(keys).toHaveLength(2);
});
