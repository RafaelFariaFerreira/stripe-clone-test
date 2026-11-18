import { CURRENCY_LABEL } from '../currency';
import { formatCalendarDay, fromIsoDay } from '../dates';
import { PAYMENT_METHOD_TYPE_LABEL } from '../payment-method';
import { STATUS_META } from '../status';
import type { AmountFilter, DateFilter } from './types';
import type { CurrencyCode, PaymentMethodType, PaymentStatus } from '../types';

/**
 * Short human summaries shown inside an applied filter pill,
 * e.g. `Status | Succeeded, Failed` or `Amount | between 10 and 100`.
 */

const DATE_PRESET_LABEL = {
  today: 'Today',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
} as const;

export function summarizeDateFilter(filter: DateFilter): string {
  if (filter.preset !== 'custom') return DATE_PRESET_LABEL[filter.preset];
  const from = fromIsoDay(filter.from);
  const to = fromIsoDay(filter.to);
  if (!from || !to) return 'Custom';
  return filter.from === filter.to ? formatCalendarDay(from) : `${formatCalendarDay(from)} – ${formatCalendarDay(to)}`;
}

export function summarizeAmountFilter(filter: AmountFilter): string {
  switch (filter.operator) {
    case 'eq':
      return `equal to ${filter.value}`;
    case 'gt':
      return `greater than ${filter.value}`;
    case 'lt':
      return `less than ${filter.value}`;
    case 'between':
      return `between ${filter.value} and ${filter.valueTo}`;
  }
}

/** Lists up to two labels and collapses the rest: `Succeeded, Failed +2`. */
function summarizeList(labels: string[]): string {
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
}

export function summarizeStatuses(statuses: readonly PaymentStatus[]): string {
  return summarizeList(statuses.map((status) => STATUS_META[status].label));
}

export function summarizeCurrencies(currencies: readonly CurrencyCode[]): string {
  return summarizeList(currencies.map((currency) => CURRENCY_LABEL[currency]));
}

export function summarizeMethods(methods: readonly PaymentMethodType[]): string {
  return summarizeList(methods.map((method) => PAYMENT_METHOD_TYPE_LABEL[method]));
}
