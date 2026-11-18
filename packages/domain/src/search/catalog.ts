import { CURRENCIES } from '../currency';
import { STATUS_META } from '../status';
import type { PaymentStatus } from '../types';

/** Filter keys understood by the search bar (`key:value`). */
export type SearchFilterKey =
  | 'is'
  | 'last4'
  | 'date'
  | 'created'
  | 'email'
  | 'status'
  | 'profile'
  | 'amount'
  | 'brand'
  | 'currency'
  | 'name'
  | 'type'
  /** Ordering of the search results page (`sort:-amount`); never filters. */
  | 'sort';

export interface SearchFilterDoc {
  key: SearchFilterKey;
  /** Example query shown next to the key chip. */
  example: string;
  /** Right-aligned description, verbatim from the Dashboard where it exists. */
  description: string;
}

/** The six suggestions shown on focus, verbatim from the Dashboard (same order). */
export const SUGGESTED_SEARCH_FILTERS: readonly SearchFilterDoc[] = [
  { key: 'is', example: 'is:customer', description: 'object type' },
  { key: 'last4', example: 'last4:2326', description: 'last four digits of the card or account' },
  { key: 'date', example: 'date:YYYY/MM/DD', description: 'object created on date or range' },
  { key: 'email', example: 'email:jenny@example.com', description: 'email address' },
  { key: 'status', example: 'status:canceled', description: 'status of an object' },
  { key: 'profile', example: 'profile:@username', description: 'other businesses on Stripe' },
];

/**
 * Additional filters revealed by "View more filters", from Stripe's search
 * documentation, limited to the ones that apply to payments.
 */
export const MORE_SEARCH_FILTERS: readonly SearchFilterDoc[] = [
  { key: 'amount', example: 'amount:>149.99', description: 'amount, with > < or a .. range' },
  { key: 'brand', example: 'brand:visa', description: 'brand of the card' },
  { key: 'created', example: 'created:2026/11/18', description: 'object created on date or range' },
  { key: 'currency', example: 'currency:EUR', description: 'three-letter currency code' },
  { key: 'name', example: 'name:jenny', description: 'cardholder or customer name' },
  { key: 'type', example: 'type:card', description: 'payment method type' },
];

export const ALL_SEARCH_FILTERS: readonly SearchFilterDoc[] = [...SUGGESTED_SEARCH_FILTERS, ...MORE_SEARCH_FILTERS];

const STATUS_VALUES = (Object.keys(STATUS_META) as PaymentStatus[]).map((status) => status);

/** Completion values for filters with a closed set of values. */
export const SEARCH_FILTER_VALUES: Readonly<Partial<Record<SearchFilterKey, readonly string[]>>> = {
  is: ['payment', 'captured', 'disputed', 'paid', 'refunded'],
  status: STATUS_VALUES,
  currency: CURRENCIES,
  brand: ['visa', 'mastercard', 'amex', 'discover'],
  type: ['card', 'ach', 'wallet', 'apple_pay', 'google_pay', 'link'],
  date: ['today', 'yesterday', '"last week"', '"last month"'],
  created: ['today', 'yesterday', '"last week"', '"last month"'],
};

const KEYS = new Set<string>([...ALL_SEARCH_FILTERS.map((filter) => filter.key), 'sort']);

export function isSearchFilterKey(value: string): value is SearchFilterKey {
  return KEYS.has(value);
}
