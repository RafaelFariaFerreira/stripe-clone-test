import { expect, test } from '@playwright/test';

test('style guide documents tokens and renders live components', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'next', 'The design system page ships with the Next.js app only.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/styleguide');

  await expect(page.getByRole('heading', { level: 1, name: 'Style guide & components' })).toBeVisible();
  // Tokens are read from tokens.css at build time.
  await expect(page.getByText('--color-brand', { exact: true })).toBeVisible();
  await expect(page.getByText('#635bff', { exact: true })).toBeVisible();
  // Live demos render the real components.
  await expect(page.locator('#badge .badge', { hasText: 'Succeeded' })).toBeVisible();
  await expect(page.locator('#table table.data-table tbody tr')).toHaveCount(4);
  await page.locator('#table .sort-button', { hasText: 'Amount' }).click();
  await expect(page.locator('#table th[aria-sort="descending"]')).toContainText('Amount');
  expect(errors).toEqual([]);
});
