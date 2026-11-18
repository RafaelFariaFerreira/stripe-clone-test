import { describe, expect, it } from 'vitest';
import {
  columnDropTarget,
  columnWidth,
  DEFAULT_COLUMN_LAYOUT,
  moveColumn,
  moveColumnBy,
  normalizeColumnLayout,
  resetColumnWidth,
  resizeColumn,
  tableMinWidth,
  visibleColumnOrder,
  type ColumnLayout,
} from '../index';

const layout: ColumnLayout = { order: [...DEFAULT_COLUMN_LAYOUT.order], widths: {} };

describe('column layout', () => {
  it('resizes only the target column, clamped to its range', () => {
    const resized = resizeColumn(layout, 'customer', 400);
    expect(columnWidth(resized, 'customer')).toBe(400);
    expect(columnWidth(resized, 'description')).toBe(154);
    expect(columnWidth(resized, 'date')).toBe(132);
    expect(columnWidth(resizeColumn(layout, 'amount', 10), 'amount')).toBe(64);
    expect(columnWidth(resizeColumn(layout, 'amount', 5000), 'amount')).toBe(640);
    expect(columnWidth(resetColumnWidth(resized, 'customer'), 'customer')).toBe(265);
  });

  it('moves a column before another one or to the end', () => {
    expect(moveColumn(layout, 'date', 'amount').order.slice(0, 2)).toEqual(['date', 'amount']);
    expect(moveColumn(layout, 'amount', null).order.at(-1)).toBe('amount');
    expect(moveColumn(layout, 'amount', 'amount')).toBe(layout);
  });

  it('moves among visible columns with the keyboard', () => {
    const visible = ['amount', 'currency', 'status', 'date'] as const;
    expect(visibleColumnOrder(moveColumnBy(layout, visible, 'currency', -1), visible)).toEqual(['currency', 'amount', 'status', 'date']);
    expect(visibleColumnOrder(moveColumnBy(layout, visible, 'currency', 1), visible)).toEqual(['amount', 'status', 'currency', 'date']);
    expect(moveColumnBy(layout, visible, 'amount', -1)).toBe(layout);
  });

  it('computes drop targets from header centers', () => {
    const cells = [
      { id: 'amount', center: 50 },
      { id: 'currency', center: 120 },
      { id: 'status', center: 200 },
    ] as const;
    expect(columnDropTarget(cells, 10, 'status')).toEqual({ beforeId: 'amount', index: 0 });
    expect(columnDropTarget(cells, 300, 'amount')).toEqual({ beforeId: null, index: 3 });
    expect(columnDropTarget(cells, 60, 'amount')).toBeUndefined();
    expect(columnDropTarget(cells, 130, 'amount')).toEqual({ beforeId: 'status', index: 2 });
  });

  it('sanitizes stored layouts and sums widths', () => {
    const restored = normalizeColumnLayout({ order: ['date', 'bogus', 'date'], widths: { amount: 1, customer: 'x', nope: 4 } });
    expect(restored.order[0]).toBe('date');
    expect(restored.order).toHaveLength(10);
    expect(restored.widths).toEqual({ amount: 64 });
    expect(normalizeColumnLayout(null)).toEqual({ order: DEFAULT_COLUMN_LAYOUT.order, widths: {} });
    expect(tableMinWidth(layout, ['amount', 'currency'])).toBe(36 + 40 + 86 + 38);
  });
});
