import { toMajorUnits } from '../currency';
import { addDays, endOfDay, fromIsoDay, startOfDay } from '../dates';
import { PAYMENT_VIEWS } from '../status';
import type { Payment } from '../types';
import type { AmountFilter, DateFilter, PaymentsQuery } from './types';

/** Inclusive time window in epoch milliseconds. */
export interface TimeRange {
  from: number;
  to: number;
}

/**
 * Resolves a date filter to an absolute window.
 * "Last 7 days" means today plus the six previous calendar days, matching how
 * people read the label (and how Stripe's presets behave).
 */
export function resolveDateFilter(filter: DateFilter, now: Date = new Date()): TimeRange | null {
  const todayEnd = endOfDay(now).getTime();
  switch (filter.preset) {
    case 'today':
      return { from: startOfDay(now).getTime(), to: todayEnd };
    case 'last_7_days':
      return { from: startOfDay(addDays(now, -6)).getTime(), to: todayEnd };
    case 'last_30_days':
      return { from: startOfDay(addDays(now, -29)).getTime(), to: todayEnd };
    case 'custom': {
      const from = fromIsoDay(filter.from);
      const to = fromIsoDay(filter.to);
      if (!from || !to) return null;
      const [start, end] = from <= to ? [from, to] : [to, from];
      return { from: startOfDay(start).getTime(), to: endOfDay(end).getTime() };
    }
  }
}

/** Amount comparison happens in major units so `> 50` reads the same in any currency. */
export function matchesAmount(payment: Payment, filter: AmountFilter): boolean {
  const value = toMajorUnits(payment.amount, payment.currency);
  switch (filter.operator) {
    case 'eq':
      return Math.abs(value - filter.value) < 0.005;
    case 'gt':
      return value > filter.value;
    case 'lt':
      return value < filter.value;
    case 'between': {
      const [min, max] = filter.value <= filter.valueTo ? [filter.value, filter.valueTo] : [filter.valueTo, filter.value];
      return value >= min && value <= max;
    }
  }
}

/**
 * Text search across payment ID, customer email and card/bank last 4.
 * Case-insensitive; the `pi_` prefix is optional; whitespace is ignored at the ends.
 */
export function matchesSearch(payment: Payment, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  if (/^\d{1,4}$/.test(term)) {
    return payment.paymentMethod.last4.includes(term) || payment.id.toLowerCase().includes(term);
  }
  const id = payment.id.toLowerCase();
  return (
    id.includes(term) ||
    id.replace(/^pi_/, '').includes(term) ||
    payment.customer.email.toLowerCase().includes(term) ||
    (payment.customer.name?.toLowerCase().includes(term) ?? false)
  );
}

/**
 * Returns a predicate for every active filter of the query. The view card is
 * treated as one more status constraint and combines (AND) with the Status
 * filter, exactly like clicking a card while a status filter is applied.
 */
export function createPaymentPredicate(
  query: PaymentsQuery,
  now: Date = new Date(),
): (payment: Payment) => boolean {
  const viewStatuses = PAYMENT_VIEWS.find((view) => view.id === query.view)?.statuses ?? null;
  const statusSet = query.statuses.length ? new Set(query.statuses) : null;
  const currencySet = query.currencies.length ? new Set(query.currencies) : null;
  const methodSet = query.methods.length ? new Set(query.methods) : null;
  const range = query.date ? resolveDateFilter(query.date, now) : null;
  const { amount, search } = query;

  return (payment) => {
    if (viewStatuses && !viewStatuses.includes(payment.status)) return false;
    if (statusSet && !statusSet.has(payment.status)) return false;
    if (currencySet && !currencySet.has(payment.currency)) return false;
    if (methodSet && !methodSet.has(payment.paymentMethod.type)) return false;
    if (range) {
      const created = new Date(payment.created).getTime();
      if (created < range.from || created > range.to) return false;
    }
    if (amount && !matchesAmount(payment, amount)) return false;
    return matchesSearch(payment, search);
  };
}
