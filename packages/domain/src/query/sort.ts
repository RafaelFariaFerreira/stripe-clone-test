import { toApproxUsd } from '../currency';
import { STATUS_META } from '../status';
import type { Payment } from '../types';
import type { SortColumn, SortDirection, SortRule } from './types';

type Comparator = (a: Payment, b: Payment) => number;

const COMPARATORS: Readonly<Record<SortColumn, Comparator>> = {
  created: (a, b) => Date.parse(a.created) - Date.parse(b.created),
  // Mixed currencies are ordered by approximate USD value (see APPROX_USD_RATE).
  amount: (a, b) => toApproxUsd(a.amount, a.currency) - toApproxUsd(b.amount, b.currency),
  status: (a, b) => STATUS_META[a.status].sortOrder - STATUS_META[b.status].sortOrder,
  customer: (a, b) => a.customer.email.localeCompare(b.customer.email),
};

/** Rows with no explicit sort are shown newest first, like the Dashboard. */
const DEFAULT_RULES: readonly SortRule[] = [{ column: 'created', direction: 'desc' }];

/**
 * Sorts by every rule in order (multi-column), falling back to newest first and
 * finally to the id, so the order is total and stable across renders.
 * Returns a new array; the input is not mutated.
 */
export function sortPayments(rows: readonly Payment[], rules: readonly SortRule[]): Payment[] {
  const chain = [...(rules.length ? rules : DEFAULT_RULES), ...DEFAULT_RULES];
  return [...rows].sort((a, b) => {
    for (const rule of chain) {
      const result = COMPARATORS[rule.column](a, b);
      if (result !== 0) return rule.direction === 'asc' ? result : -result;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Computes the next sort state after a header click.
 *
 * - Plain click: the column becomes the only sort, cycling desc → asc → none
 *   (desc first because "newest" and "largest" are what people look for).
 * - Additive click (Shift): the column is appended to (or cycled within) the
 *   existing rules, enabling multi-column sorting.
 */
export function toggleSort(rules: readonly SortRule[], column: SortColumn, additive = false): SortRule[] {
  const index = rules.findIndex((rule) => rule.column === column);
  const current = index >= 0 ? rules[index] : undefined;
  const next: SortDirection | null = !current ? 'desc' : current.direction === 'desc' ? 'asc' : null;

  if (!additive) {
    return next ? [{ column, direction: next }] : [];
  }
  const copy = [...rules];
  if (current) {
    if (next) copy[index] = { column, direction: next };
    else copy.splice(index, 1);
    return copy;
  }
  return [...copy, { column, direction: 'desc' }];
}

/** Looks up the direction and 1-based priority of a column, for header indicators. */
export function getSortState(rules: readonly SortRule[], column: SortColumn): { direction: SortDirection; priority: number } | null {
  const index = rules.findIndex((rule) => rule.column === column);
  const rule = rules[index];
  return rule ? { direction: rule.direction, priority: index + 1 } : null;
}
