import { expect, test, type Locator, type Page } from '@playwright/test';

/** Column resizing and reordering on the Payments table (same contract in both apps). */

const table = (page: Page) => page.locator('table.data-table:not([aria-busy])');
const header = (page: Page, name: string) => table(page).locator('thead th', { hasText: name }).first();
const headerTexts = async (page: Page) =>
  (await table(page).locator('thead th[data-reorderable]').allInnerTexts()).map((text) => text.trim()).filter(Boolean);

async function openPayments(page: Page) {
  await page.goto('/payments');
  await page.evaluate(() => localStorage.removeItem('payments.table.layout'));
  await page.reload();
  await expect(table(page).locator('tbody tr').first()).toBeVisible();
}

async function width(locator: Locator) {
  return (await locator.boundingBox())?.width ?? 0;
}

test.describe('Payments table columns', () => {
  test('shows the resize borders after the pointer rests on the header for 2s, without reflow', async ({ page }) => {
    await openPayments(page);
    const before = await header(page, 'Description').boundingBox();
    const line = table(page).locator('.column-resizer').first();
    const color = () => line.evaluate((element) => getComputedStyle(element, '::before').backgroundColor);

    expect(await color()).toBe('rgba(0, 0, 0, 0)');
    const box = await header(page, 'Customer').boundingBox();
    await page.mouse.move(box!.x + 20, box!.y + box!.height / 2);
    await page.waitForTimeout(800);
    expect(await color()).toBe('rgba(0, 0, 0, 0)');
    await expect(table(page)).toHaveAttribute('data-show-resizers', 'true', { timeout: 3000 });
    expect(await color()).not.toBe('rgba(0, 0, 0, 0)');
    expect(await header(page, 'Description').boundingBox()).toEqual(before);
  });

  test('a hovered border lights up in the link color with a glow, and turns off on leave', async ({ page }) => {
    await openPayments(page);
    const handle = header(page, 'Description').locator('.column-resizer');
    const line = () =>
      handle.evaluate((element) => {
        const style = getComputedStyle(element, '::before');
        return { color: style.backgroundColor, glow: style.boxShadow };
      });
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(async () => (await line()).color).toBe('rgb(83, 58, 253)');
    expect((await line()).glow).not.toBe('none');

    await page.mouse.move(box.x + box.width / 2, box.y + 200);
    await expect.poll(async () => (await line()).color).toBe('rgba(0, 0, 0, 0)');
  });

  test('dragging a border resizes only that column', async ({ page }) => {
    await openPayments(page);
    const description = header(page, 'Description');
    const neighbours = [header(page, 'Payment method'), header(page, 'Customer'), header(page, 'Date')];
    const widthsBefore = await Promise.all(neighbours.map(width));
    const start = await width(description);

    const handle = description.locator('.column-resizer');
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();

    expect(Math.round(await width(description))).toBe(Math.round(start + 60));
    expect(await Promise.all(neighbours.map(width))).toEqual(widthsBefore);

    // Persisted across reloads.
    await page.reload();
    await expect(table(page).locator('tbody tr').first()).toBeVisible();
    expect(Math.round(await width(header(page, 'Description')))).toBe(Math.round(start + 60));
  });

  test('dragging a header reorders the column without sorting it', async ({ page }) => {
    await openPayments(page);
    const order = await headerTexts(page);
    expect(order.indexOf('Customer')).toBeGreaterThan(order.indexOf('Description'));

    const customer = (await header(page, 'Customer').boundingBox())!;
    const description = (await header(page, 'Description').boundingBox())!;
    await page.mouse.move(customer.x + customer.width / 2, customer.y + customer.height / 2);
    await page.mouse.down();
    await page.mouse.move(description.x + 10, description.y + description.height / 2, { steps: 10 });
    await expect(page.locator('.column-drag-ghost')).toHaveText('Customer');
    await page.mouse.up();

    const next = await headerTexts(page);
    expect(next.indexOf('Customer')).toBe(order.indexOf('Description'));
    expect(page.url()).not.toContain('sort=');

    // A plain click still sorts.
    await header(page, 'Customer').getByRole('button').click();
    await expect(page).toHaveURL(/sort=/);
  });

  test('moves and resizes columns from the keyboard', async ({ page }) => {
    await openPayments(page);
    const order = await headerTexts(page);
    await header(page, 'Customer').getByRole('button').focus();
    await page.keyboard.press('Alt+ArrowRight');
    const next = await headerTexts(page);
    expect(next.indexOf('Customer')).toBe(order.indexOf('Customer') + 1);

    const separator = page.getByRole('separator', { name: 'Resize Customer column' });
    const start = Number(await separator.getAttribute('aria-valuenow'));
    await separator.focus();
    await page.keyboard.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', String(start + 8));
    await page.keyboard.press('Enter');
    await expect(separator).toHaveAttribute('aria-valuenow', String(start));
  });
});
