import type { Payment } from '../types';
import { createPaymentPredicate } from './filter';
import { sortPayments } from './sort';
import type { PaymentsQuery, QueryResult } from './types';

/**
 * Slices one page out of an already filtered and sorted list. The page is
 * clamped, so a stale `page=9` in a shared link still shows the last page.
 */
export function paginate<T>(rows: readonly T[], page: number, pageSize: number): QueryResult<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  return {
    rows: pageRows,
    total,
    page: safePage,
    pageCount,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: start + pageRows.length,
  };
}

/** Filters and sorts the full dataset; the result feeds both pagination and CSV export. */
export function filterAndSort(
  rows: readonly Payment[],
  query: PaymentsQuery,
  now: Date = new Date(),
): Payment[] {
  return sortPayments(rows.filter(createPaymentPredicate(query, now)), query.sort);
}

/**
 * Runs the whole query: filter → sort → paginate. For 300–1,000 rows this takes
 * well under a few milliseconds, so it runs synchronously on every change and
 * the apps only memoize it.
 */
export function applyQuery(
  rows: readonly Payment[],
  query: PaymentsQuery,
  now: Date = new Date(),
): QueryResult<Payment> {
  return paginate(filterAndSort(rows, query, now), query.page, query.pageSize);
}

/** True when any filter (not the view card, search, sort or paging) is active. */
export function hasActiveFilters(query: PaymentsQuery): boolean {
  return Boolean(
    query.date || query.amount || query.currencies.length || query.statuses.length || query.methods.length,
  );
}
