import { expect, test } from '@playwright/test';

/** The top-bar search dropdown, modelled on the Dashboard's (both apps). */
test.describe('Search bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/payments');
    await expect(page.locator('table.data-table:not([aria-busy]) tbody tr').first()).toBeVisible();
  });

  test('suggests the Dashboard filters on focus and expands with "View more filters"', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Search payments' }).click();
    const listbox = page.getByRole('listbox', { name: 'Search suggestions' });
    await expect(listbox.getByText('Suggested filters')).toBeVisible();
    await expect(listbox.locator('.search-option__key')).toHaveText(['is:', 'last4:', 'date:', 'email:', 'status:', 'profile:']);
    await listbox.getByRole('option', { name: 'View more filters' }).click();
    await expect(listbox.locator('.search-option__key', { hasText: 'amount:' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'View fewer filters' })).toBeVisible();
  });

  test('inserts a filter with the keyboard, completes values and previews results', async ({ page }) => {
    const search = page.getByRole('combobox', { name: 'Search payments' });
    await search.click();
    // ArrowDown ×5 → "status:", Enter inserts it.
    for (let step = 0; step < 5; step += 1) await search.press('ArrowDown');
    await expect(search).toHaveAttribute('aria-activedescendant', 'search-filter-status');
    await search.press('Enter');
    await expect(search).toHaveValue('status:');

    await search.pressSequentially('fa');
    const listbox = page.getByRole('listbox', { name: 'Search suggestions' });
    await expect(listbox.getByText('Suggested values')).toBeVisible();
    await listbox.getByRole('option', { name: /status:failed/ }).click();
    await expect(search).toHaveValue('status:failed ');

    await search.pressSequentially('currency:brl');
    await expect(listbox.getByRole('option', { name: /Show only payment results for status:failed currency:brl/ })).toBeVisible();
    const results = listbox.locator('[id^="search-payment-"]');
    await expect(results.first()).toBeVisible();
    expect(await results.count()).toBeLessThanOrEqual(8);
    for (const text of await results.allInnerTexts()) expect(text).toContain('R$');

    await search.press('Enter');
    await expect(page).toHaveURL(/\/search\?/);
    await expect.poll(() => new URL(page.url()).searchParams.get('query')).toBe('status:failed currency:brl');
    const badges = await page.locator('.data-table--search tbody .badge').allInnerTexts();
    expect(new Set(badges.map((badge) => badge.trim()))).toEqual(new Set(['Failed']));
  });

  test('opens a payment from the live results', async ({ page }) => {
    const search = page.getByRole('combobox', { name: 'Search payments' });
    await search.fill('subscription');
    const first = page.locator('[id^="search-payment-"]').first();
    const id = (await first.getAttribute('id'))?.replace('search-payment-', '');
    await first.click();
    await expect(page).toHaveURL(new RegExp(`/payments/${id}$`));
  });
});
