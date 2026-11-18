import { expect, test, type Page } from '@playwright/test';

/** The search results page (`/search?query=…`), on both apps. */
const resultRows = (page: Page) => page.locator('.data-table--search tbody tr');
const queryParam = (page: Page) => new URL(page.url()).searchParams.get('query');

test.describe('Search results page', () => {
  test('"Show only payment results" opens the results page scoped to payments', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.locator('table.data-table:not([aria-busy]) tbody tr').first()).toBeVisible();
    const search = page.getByRole('combobox', { name: 'Search payments' });
    await search.fill('status:failed');
    await page.getByRole('option', { name: /Show only payment results for status:failed/ }).click();

    await expect(page).toHaveURL(/\/search\?query=/);
    expect(queryParam(page)).toBe('status:failed is:payment');
    await expect(page.getByRole('heading', { level: 1, name: 'Search results: Payments' })).toBeVisible();
    await expect(page.locator('.filter-count')).toHaveText('1');
    await expect(search).toHaveValue('status:failed is:payment');
    await expect(page.getByRole('listbox', { name: 'Search suggestions' })).toBeHidden();
    const badges = await page.locator('.data-table--search tbody .badge').allInnerTexts();
    expect(new Set(badges.map((badge) => badge.trim()))).toEqual(new Set(['Failed']));
    await expect(page.locator('.search-page__footer')).toContainText(/\d+ items/);
  });

  test('sorting writes sort: into the query', async ({ page }) => {
    await page.goto('/search?query=is%3Apayment');
    await expect(resultRows(page).first()).toBeVisible();
    await page.getByLabel('Sort results').selectOption('amount_desc');
    await expect.poll(() => queryParam(page)).toBe('is:payment sort:-amount');
    await expect(page.locator('.data-table--search th[aria-sort="descending"]')).toContainText('Amount');
    await page.locator('.data-table--search .sort-button', { hasText: 'Date' }).click();
    await expect.poll(() => queryParam(page)).toBe('is:payment sort:-created');
  });

  test('the Filters panel writes is:, date: and amount: terms', async ({ page }) => {
    await page.goto('/search?query=status%3Asucceeded');
    await expect(resultRows(page).first()).toBeVisible();
    await page.getByRole('button', { name: /^Filter/ }).click();
    const panel = page.getByRole('dialog', { name: 'Filters' });
    await panel.getByLabel('Amount', { exact: true }).check();
    await panel.getByLabel('Amount comparison').selectOption('between');
    await panel.getByLabel('Minimum amount').fill('10');
    await panel.getByLabel('Maximum amount').fill('20');
    await panel.getByRole('button', { name: 'Done' }).click();

    await expect.poll(() => queryParam(page)).toBe('status:succeeded amount:10..20');
    await expect(page.locator('.filter-count')).toHaveText('1');
    for (const text of await page.locator('.data-table--search tbody .cell-amount').allInnerTexts()) {
      const value = Number(text.replace(/[^\d.]/g, ''));
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }

    await page.getByRole('button', { name: /^Filter/ }).click();
    await page.getByRole('dialog', { name: 'Filters' }).getByRole('button', { name: 'Clear' }).click();
    await expect.poll(() => queryParam(page)).toBe('status:succeeded');
  });

  test('shows the empty state and the row menu', async ({ page }) => {
    await page.goto('/search?query=no-payment-matches-this');
    await expect(page.getByRole('heading', { level: 1, name: 'Search results' })).toBeVisible();
    await expect(page.getByText('No search results found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Search the support site' })).toBeVisible();

    await page.goto('/search?query=is%3Apayment');
    await resultRows(page).first().getByRole('button', { name: 'More options' }).click();
    await expect(page.getByRole('menuitem', { name: 'Copy payment ID' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /View customer/ })).toBeVisible();
    await page.getByRole('menuitem', { name: /View payment details/ }).click();
    await expect(page).toHaveURL(/\/payments\/pi_/);
  });
});
