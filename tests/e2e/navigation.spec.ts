import { test, expect } from '@playwright/test';
test('visitors can reach activities, courses, contact and booking', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dive into another world.' })).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Activities', exact: true }).click();
  await expect(page.locator('#activities')).toBeInViewport();
  await page.getByRole('link', { name: 'Details and availability' }).first().click();
  await expect(page.getByRole('heading', { name: 'Discover Scuba Diving' })).toBeVisible();
  await page.goto('/book');
  await expect(page.getByRole('heading', { name: 'Book your dive' })).toBeVisible();
});
