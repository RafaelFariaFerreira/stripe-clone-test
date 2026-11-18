import { expect, test, type Page } from '@playwright/test';

/** Waits until the table shows data rows (not the skeleton). */
async function openPayments(page: Page, search = '') {
  await page.goto(`/payments${search}`);
  await expect(page.locator('table.data-table:not([aria-busy]) tbody tr').first()).toBeVisible();
}

const rows = (page: Page) => page.locator('table.data-table:not([aria-busy]) tbody tr');

test.describe('Payments list', () => {
  test('renders the reference layout with 25 rows per page', async ({ page }) => {
    await openPayments(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();
    for (const label of ['All', 'Succeeded', 'Refunded', 'Disputed', 'Failed', 'Uncaptured']) {
      await expect(page.getByRole('tab', { name: label, exact: true })).toBeVisible();
    }
    for (const pill of ['Date and time', 'Amount', 'Currency', 'Status', 'Payment method', 'More filters']) {
      await expect(page.locator('.filter-pill', { hasText: pill }).first()).toBeVisible();
    }
    await expect(rows(page)).toHaveCount(25);
    await expect(page.locator('.pagination__summary')).toHaveText(/Viewing 1–25 of 600 results/);
  });

  test('paginates with 25, 50 or 100 rows per page', async ({ page }) => {
    await openPayments(page);
    await page.getByLabel('Rows per page').selectOption('50');
    // Clicked straight away on purpose: rapid updates must not lose the page size.
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect.poll(() => Object.fromEntries(new URL(page.url()).searchParams)).toEqual({ page: '2', size: '50' });
    await expect(rows(page)).toHaveCount(50);
    await expect(page.locator('.pagination__summary')).toHaveText(/Viewing 51–100 of 600 results/);
  });

  test('filters by status through the pill popover', async ({ page }) => {
    await openPayments(page);
    await page.locator('.filter-pill__trigger', { hasText: 'Status' }).click();
    const panel = page.getByRole('dialog', { name: 'Status filter' });
    await panel.getByLabel('Failed').check();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/status=failed/);
    await expect(page.locator('.filter-pill[data-active="true"]')).toContainText('Failed');
    const badges = await page.locator('tbody .badge').allInnerTexts();
    expect(new Set(badges.map((text) => text.trim()))).toEqual(new Set(['Failed']));
  });

  test('applies date presets and amount ranges from the URL', async ({ page }) => {
    await openPayments(page, '?date=today');
    await expect(page.locator('.filter-pill[data-active="true"]')).toContainText('Today');
    await openPayments(page, '?amount=between:10:20');
    const amounts = await page.locator('tbody .cell-amount').allInnerTexts();
    for (const text of amounts) {
      const value = Number(text.replace(/[^\d.]/g, ''));
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  test('searches by email and by last 4 digits', async ({ page }) => {
    await openPayments(page);
    const email = (await rows(page).first().locator('td').nth(6).innerText()).trim();
    const search = page.getByRole('combobox', { name: 'Search payments' });
    await search.fill(email);
    await search.press('Enter');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(email);
    for (const cell of await page.locator('tbody tr td:nth-child(7)').allInnerTexts()) expect(cell.trim()).toBe(email);

    await search.fill('4242');
    await search.press('Enter');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('4242');
  });

  test('sorts by amount, date and status (multi-column with Shift)', async ({ page }) => {
    await openPayments(page);
    const header = page.locator('thead');
    const sortParam = () => new URL(page.url()).searchParams.get('sort');
    await header.getByRole('button', { name: /^Amount/ }).click();
    await expect.poll(sortParam).toBe('-amount');
    await expect(page.locator('th[aria-sort="descending"]')).toContainText('Amount');
    await header.getByRole('button', { name: /^Status/ }).click({ modifiers: ['Shift'] });
    await expect.poll(sortParam).toBe('-amount,-status');
    await header.getByRole('button', { name: /^Date/ }).click();
    await expect.poll(sortParam).toBe('-created');
  });

  test('shows tooltips for relative time and copy-to-clipboard', async ({ page }) => {
    await openPayments(page);
    await rows(page).first().locator('time').first().hover();
    await expect(page.locator('.tooltip')).toContainText(/ago|just now/);
    const chip = rows(page).first().locator('.copyable-id');
    await chip.hover();
    await expect(page.locator('.tooltip')).toHaveText('Copy to clipboard');
    await chip.click();
    await expect(page.locator('.tooltip')).toHaveText('Copied!');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^pi_/);
  });

  test('shows the empty state and clears it', async ({ page }) => {
    await page.goto('/payments?q=no-payment-matches-this');
    await expect(page.getByText('No results', { exact: true })).toBeVisible();
    await expect(page.getByText('No results match your criteria')).toBeVisible();
    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(rows(page)).toHaveCount(25);
  });
});

test.describe('Payment details', () => {
  test('opens from the table and shows the timeline, breakdown and metadata', async ({ page }) => {
    await openPayments(page);
    const amount = (await rows(page).first().locator('.cell-amount').innerText()).trim();
    await rows(page).first().locator('.cell-amount a').click();
    await expect(page).toHaveURL(/\/payments\/pi_/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(amount);
    for (const section of ['Recent activity', 'Payment breakdown', 'Payment method', 'Details', 'Customer', 'Metadata']) {
      await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible();
    }
    await expect(page.locator('.timeline__item').first()).toBeVisible();
    await page.getByRole('link', { name: 'Transactions' }).first().click();
    await expect(page).toHaveURL(/\/payments$/);
  });

  test('handles unknown payments', async ({ page }) => {
    await page.goto('/payments/pi_does_not_exist');
    await expect(page.getByRole('heading', { name: 'No such payment' })).toBeVisible();
  });
});
