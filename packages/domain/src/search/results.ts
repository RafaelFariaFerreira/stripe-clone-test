import { addDays, startOfDay } from '../dates';
import { paginate } from '../query/apply';
import { sortPayments } from '../query/sort';
import type { QueryResult, SortRule } from '../query/types';
import type { Payment } from '../types';
import { matchesSearchTerms, parseSearch, tokenizeSearch } from './query';

/**
 * The search results page (`/search?query=…`), modelled on the Dashboard:
 * every control writes back into the query text, so the URL is the whole
 * state. The sort select adds `sort:…`; the Filters panel adds `is:`, `date:`
 * and `amount:` terms.
 */

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export type SearchSort = 'relevance' | 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

export const SEARCH_SORT_OPTIONS: ReadonlyArray<{ id: SearchSort; label: string; token: string | null }> = [
  { id: 'relevance', label: 'Most relevant', token: null },
  { id: 'newest', label: 'Newest first', token: '-created' },
  { id: 'oldest', label: 'Oldest first', token: 'created' },
  { id: 'amount_desc', label: 'Highest amount', token: '-amount' },
  { id: 'amount_asc', label: 'Lowest amount', token: 'amount' },
];

const SORT_RULES: Readonly<Record<SearchSort, SortRule[]>> = {
  // Without a relevance score, "Most relevant" shows the newest first, like the Dashboard does for exact filters.
  relevance: [],
  newest: [{ column: 'created', direction: 'desc' }],
  oldest: [{ column: 'created', direction: 'asc' }],
  amount_desc: [{ column: 'amount', direction: 'desc' }],
  amount_asc: [{ column: 'amount', direction: 'asc' }],
};

const tokenKey = (token: string) => /^-?([a-z_0-9]+):/i.exec(token)?.[1]?.toLowerCase() ?? null;

/** Removes every token whose key is in `keys` (keeps free text and other filters). */
function withoutKeys(query: string, keys: readonly string[]): string[] {
  return tokenizeSearch(query.trim()).filter((token) => !keys.includes(tokenKey(token) ?? ''));
}

export function getSearchSort(query: string): SearchSort {
  const term = parseSearch(query).find((item) => item.field === 'sort');
  return SEARCH_SORT_OPTIONS.find((option) => option.token === term?.value)?.id ?? 'relevance';
}

/** Rewrites the `sort:` term of a query (`relevance` removes it). */
export function withSearchSort(query: string, sort: SearchSort): string {
  const token = SEARCH_SORT_OPTIONS.find((option) => option.id === sort)?.token;
  return [...withoutKeys(query, ['sort']), ...(token ? [`sort:${token}`] : [])].join(' ');
}

/** Header click on Amount / Date: cycles descending → ascending. */
export function toggleSearchSort(query: string, column: 'amount' | 'created'): string {
  const current = getSearchSort(query);
  const desc: SearchSort = column === 'amount' ? 'amount_desc' : 'newest';
  const asc: SearchSort = column === 'amount' ? 'amount_asc' : 'oldest';
  return withSearchSort(query, current === desc ? asc : desc);
}

// ---------------------------------------------------------------------------
// Filters panel (Type / Date / Amount) ⇄ query terms
// ---------------------------------------------------------------------------

export type PaymentTypeFlag = 'captured' | 'disputed' | 'paid' | 'refunded';
export const PAYMENT_TYPE_FLAGS: readonly PaymentTypeFlag[] = ['captured', 'disputed', 'paid', 'refunded'];

export type SearchDateOperator = 'last' | 'eq' | 'between' | 'after' | 'before';
export type SearchDateUnit = 'hours' | 'days' | 'months';
export type SearchAmountOperator = 'eq' | 'between' | 'gt' | 'lt';

export interface SearchFilterPanel {
  type: { enabled: boolean; flags: PaymentTypeFlag[] };
  date: { enabled: boolean; operator: SearchDateOperator; amount: number; unit: SearchDateUnit; from: string; to: string };
  amount: { enabled: boolean; operator: SearchAmountOperator; value: string; valueTo: string };
}

export const SEARCH_DATE_OPERATORS: ReadonlyArray<{ id: SearchDateOperator; label: string }> = [
  { id: 'last', label: 'is in the last' },
  { id: 'eq', label: 'is equal to' },
  { id: 'between', label: 'is between' },
  { id: 'after', label: 'is on or after' },
  { id: 'before', label: 'is before or on' },
];

export const SEARCH_AMOUNT_OPERATORS: ReadonlyArray<{ id: SearchAmountOperator; label: string }> = [
  { id: 'eq', label: 'is equal to' },
  { id: 'between', label: 'is between' },
  { id: 'gt', label: 'is greater than' },
  { id: 'lt', label: 'is less than' },
];

/** `MM/DD/YYYY`, the format the Dashboard writes into date terms. */
function usDay(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

/** `YYYY-MM-DD` (date inputs) → `MM/DD/YYYY`. */
function isoToUs(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${m}/${d}/${y}` : iso;
}

/** `MM/DD/YYYY` or `YYYY/MM/DD` → `YYYY-MM-DD` for date inputs. */
function toIso(value: string): string {
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (us) return `${us[3]}-${us[1]?.padStart(2, '0')}-${us[2]?.padStart(2, '0')}`;
  const iso = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]?.padStart(2, '0')}-${iso[3]?.padStart(2, '0')}`;
  return '';
}

const DAY = 24 * 60 * 60 * 1000;

export function emptySearchFilterPanel(): SearchFilterPanel {
  return {
    type: { enabled: false, flags: [] },
    date: { enabled: false, operator: 'last', amount: 7, unit: 'days', from: '', to: '' },
    amount: { enabled: false, operator: 'eq', value: '', valueTo: '' },
  };
}

/** Reads the panel state from a query (best effort for dates written by hand). */
export function readSearchFilterPanel(query: string, now: Date = new Date()): SearchFilterPanel {
  const panel = emptySearchFilterPanel();
  for (const term of parseSearch(query)) {
    if (term.negated) continue;
    if (term.field === 'is') {
      panel.type.enabled = true;
      const flag = term.value.toLowerCase() as PaymentTypeFlag;
      if (PAYMENT_TYPE_FLAGS.includes(flag)) panel.type.flags.push(flag);
    } else if (term.field === 'date' || term.field === 'created') {
      panel.date.enabled = true;
      const [from = '', to] = term.value.split(/\.\.|…/);
      if (to !== undefined) {
        if (to.toLowerCase() === 'today') {
          const days = Math.round((startOfDay(now).getTime() - new Date(`${toIso(from)}T00:00:00`).getTime()) / DAY);
          if (Number.isFinite(days) && days > 0) Object.assign(panel.date, { operator: 'last', amount: days, unit: 'days' });
          else Object.assign(panel.date, { operator: 'after', from: toIso(from) });
        } else {
          Object.assign(panel.date, { operator: 'between', from: toIso(from), to: toIso(to) });
        }
      } else if (from.startsWith('<')) {
        const next = new Date(`${toIso(from.slice(1))}T00:00:00`);
        Object.assign(panel.date, { operator: 'before', to: toIso(usDay(addDays(next, -1))) });
      } else if (from.startsWith('>')) {
        const previous = new Date(`${toIso(from.slice(1))}T00:00:00`);
        Object.assign(panel.date, { operator: 'after', from: toIso(usDay(addDays(previous, 1))) });
      } else {
        Object.assign(panel.date, { operator: 'eq', from: toIso(from) });
      }
    } else if (term.field === 'amount') {
      panel.amount.enabled = true;
      const value = term.value;
      const range = value.split(/\.\.|…/);
      if (range.length === 2) Object.assign(panel.amount, { operator: 'between', value: range[0], valueTo: range[1] });
      else if (value.startsWith('>')) Object.assign(panel.amount, { operator: 'gt', value: value.slice(1) });
      else if (value.startsWith('<')) Object.assign(panel.amount, { operator: 'lt', value: value.slice(1) });
      else Object.assign(panel.amount, { operator: 'eq', value });
    }
  }
  return panel;
}

function dateToken(date: SearchFilterPanel['date'], now: Date): string | null {
  switch (date.operator) {
    case 'last': {
      if (!(date.amount > 0)) return null;
      const from =
        date.unit === 'months'
          ? new Date(now.getFullYear(), now.getMonth() - date.amount, now.getDate())
          : date.unit === 'hours'
            ? new Date(now.getTime() - date.amount * 60 * 60 * 1000)
            : addDays(now, -date.amount);
      return `date:${usDay(from)}..today`;
    }
    case 'eq':
      return date.from ? `date:${isoToUs(date.from)}` : null;
    case 'between':
      return date.from && date.to ? `date:${isoToUs(date.from)}..${isoToUs(date.to)}` : null;
    case 'after':
      return date.from ? `date:${isoToUs(date.from)}..today` : null;
    case 'before': {
      if (!date.to) return null;
      return `date:<${usDay(addDays(new Date(`${date.to}T00:00:00`), 1))}`;
    }
  }
}

function amountToken(amount: SearchFilterPanel['amount']): string | null {
  const value = amount.value.trim();
  if (!value) return null;
  switch (amount.operator) {
    case 'eq':
      return `amount:${value}`;
    case 'gt':
      return `amount:>${value}`;
    case 'lt':
      return `amount:<${value}`;
    case 'between':
      return amount.valueTo.trim() ? `amount:${value}..${amount.valueTo.trim()}` : null;
  }
}

/**
 * Writes the panel back into the query: existing `is:`, `date:`, `created:`
 * and `amount:` terms are replaced, everything else (free text, status:,
 * sort:…) is kept.
 */
export function writeSearchFilterPanel(query: string, panel: SearchFilterPanel, now: Date = new Date()): string {
  const kept = withoutKeys(query, ['is', 'date', 'created', 'amount']);
  const sortIndex = kept.findIndex((token) => tokenKey(token) === 'sort');
  const head = sortIndex >= 0 ? kept.slice(0, sortIndex) : kept;
  const tail = sortIndex >= 0 ? kept.slice(sortIndex) : [];
  const added: string[] = [];
  if (panel.type.enabled) added.push('is:payment', ...panel.type.flags.map((flag) => `is:${flag}`));
  if (panel.date.enabled) {
    const token = dateToken(panel.date, now);
    if (token) added.push(token);
  }
  if (panel.amount.enabled) {
    const token = amountToken(panel.amount);
    if (token) added.push(token);
  }
  return [...head, ...added, ...tail].join(' ');
}

/** Number shown on the Filter button: one per active panel section. */
export function countSearchFilters(query: string): number {
  const panel = readSearchFilterPanel(query);
  return [panel.type.enabled, panel.date.enabled, panel.amount.enabled].filter(Boolean).length;
}

/** Removes every panel filter ("clear your filters" in the empty state). */
export function clearSearchFilters(query: string): string {
  return withoutKeys(query, ['is', 'date', 'created', 'amount']).join(' ');
}

/** Ensures the query is scoped to payments (`… is:payment`), for "Show only payment results". */
export function scopeToPayments(query: string): string {
  const terms = parseSearch(query);
  return terms.some((term) => term.field === 'is' && term.value.toLowerCase() === 'payment') ? query.trim() : `${query.trim()} is:payment`;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export const SEARCH_PAGE_SIZE = 20;

/** Every payment matching the query, ordered by its `sort:` term. */
export function searchAllPayments(payments: readonly Payment[], query: string, now: Date = new Date()): Payment[] {
  const terms = parseSearch(query);
  if (!terms.some((term) => term.field !== 'sort')) return [];
  return sortPayments(
    payments.filter((payment) => matchesSearchTerms(payment, terms, now)),
    SORT_RULES[getSearchSort(query)],
  );
}

/** One page of search results. */
export function searchResultsPage(payments: readonly Payment[], query: string, page: number, now: Date = new Date()): QueryResult<Payment> {
  return paginate(searchAllPayments(payments, query, now), page, SEARCH_PAGE_SIZE);
}

/** Statuses whose money was never collected render their amount muted, like the Dashboard. */
export function isUncollected(payment: Payment): boolean {
  return ['failed', 'canceled', 'blocked', 'incomplete'].includes(payment.status);
}

/** URL of the results page for a query. */
export function searchResultsHref(query: string): string {
  return `/search?query=${encodeURIComponent(query.trim())}`;
}
