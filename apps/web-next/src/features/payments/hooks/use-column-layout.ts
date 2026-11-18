'use client';

import { DEFAULT_COLUMN_LAYOUT, normalizeColumnLayout, type ColumnLayout } from '@stripe-clone/domain';
import { useMemo } from 'react';
import { usePreference } from '@/lib/use-preference';

export const COLUMN_LAYOUT_KEY = 'payments.table.layout';

/**
 * The persisted column order and widths of the Payments table. The stored
 * value is sanitized on read, so stale or hand-edited data can't break it.
 */
export function useColumnLayout() {
  const [stored, setStored] = usePreference<unknown>(COLUMN_LAYOUT_KEY, DEFAULT_COLUMN_LAYOUT);
  const layout = useMemo(() => normalizeColumnLayout(stored), [stored]);
  return {
    layout,
    setLayout: (next: ColumnLayout) => setStored(next),
    resetLayout: () => setStored(DEFAULT_COLUMN_LAYOUT),
    customized: layout.order.join() !== DEFAULT_COLUMN_LAYOUT.order.join() || Object.keys(layout.widths).length > 0,
  };
}
