import { CURRENCIES } from '../currency';
import { PAYMENT_METHOD_TYPES } from '../payment-method';
import { PAYMENT_VIEWS, STATUS_META } from '../status';
import type { PaymentsView } from '../status';
import type { CurrencyCode, PaymentMethodType, PaymentStatus } from '../types';
import { DEFAULT_QUERY, PAGE_SIZES } from './types';
import type { AmountFilter, DateFilter, PageSize, PaymentsQuery, SortColumn, SortRule } from './types';

/**
 * URL format (every key is optional; defaults are omitted to keep links short):
 *
 * | key      | example                     |
 * | -------- | --------------------------- |
 * | `view`   | `failed`                    |
 * | `q`      | `jjuan@`                    |
 * | `date`   | `today`, `7d`, `30d`, `2026-11-01..2026-11-18` |
 * | `amount` | `gt:50`, `lt:5`, `eq:9.88`, `between:10:100`   |
 * | `currency` | `usd,gbp`                 |
 * | `status` | `succeeded,failed`          |
 * | `method` | `card,wallet`               |
 * | `sort`   | `-created,amount` (`-` = descending) |
 * | `page`   | `2`                         |
 * | `size`   | `50`                        |
 *
 * Parsing is defensive: unknown values are dropped instead of throwing, so a
 * hand-edited or outdated link always renders something sensible.
 */

/** Minimal read interface satisfied by `URLSearchParams` and Next's `ReadonlyURLSearchParams`. */
export interface SearchParamsReader {
  get(name: string): string | null;
}

const VIEW_IDS = new Set<string>(PAYMENT_VIEWS.map((view) => view.id));
const STATUS_IDS = new Set<string>(Object.keys(STATUS_META));
const CURRENCY_IDS = new Set<string>(CURRENCIES);
const METHOD_IDS = new Set<string>(PAYMENT_METHOD_TYPES);
const SORT_COLUMNS = new Set<string>(['created', 'amount', 'status', 'customer']);

const DATE_PRESET_TO_URL = { today: 'today', last_7_days: '7d', last_30_days: '30d' } as const;

function parseList<T extends string>(raw: string | null, allowed: Set<string>): T[] {
  if (!raw) return [];
  return [...new Set(raw.split(',').map((item) => item.trim()))].filter((item) => allowed.has(item)) as T[];
}

function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseDateFilter(raw: string | null): DateFilter | null {
  if (!raw) return null;
  if (raw === 'today') return { preset: 'today' };
  if (raw === '7d') return { preset: 'last_7_days' };
  if (raw === '30d') return { preset: 'last_30_days' };
  const match = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(raw);
  return match?.[1] && match[2] ? { preset: 'custom', from: match[1], to: match[2] } : null;
}

export function serializeDateFilter(filter: DateFilter): string {
  return filter.preset === 'custom' ? `${filter.from}..${filter.to}` : DATE_PRESET_TO_URL[filter.preset];
}

export function parseAmountFilter(raw: string | null): AmountFilter | null {
  if (!raw) return null;
  const [operator, first, second] = raw.split(':');
  const value = parseNumber(first);
  if (value === null) return null;
  switch (operator) {
    case 'eq':
    case 'gt':
    case 'lt':
      return { operator, value };
    case 'between': {
      const valueTo = parseNumber(second);
      return valueTo === null ? null : { operator, value, valueTo };
    }
    default:
      return null;
  }
}

export function serializeAmountFilter(filter: AmountFilter): string {
  return filter.operator === 'between' ? `between:${filter.value}:${filter.valueTo}` : `${filter.operator}:${filter.value}`;
}

function parseSort(raw: string | null): SortRule[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const rules: SortRule[] = [];
  for (const token of raw.split(',')) {
    const descending = token.startsWith('-');
    const column = descending ? token.slice(1) : token;
    if (!SORT_COLUMNS.has(column) || seen.has(column)) continue;
    seen.add(column);
    rules.push({ column: column as SortColumn, direction: descending ? 'desc' : 'asc' });
  }
  return rules;
}

/** Reads a {@link PaymentsQuery} from URL search params. */
export function parseQuery(params: SearchParamsReader): PaymentsQuery {
  const view = params.get('view');
  const size = Number(params.get('size'));
  const page = Number(params.get('page'));
  return {
    view: view && VIEW_IDS.has(view) ? (view as PaymentsView) : DEFAULT_QUERY.view,
    search: params.get('q') ?? '',
    date: parseDateFilter(params.get('date')),
    amount: parseAmountFilter(params.get('amount')),
    currencies: parseList<CurrencyCode>(params.get('currency'), CURRENCY_IDS),
    statuses: parseList<PaymentStatus>(params.get('status'), STATUS_IDS),
    methods: parseList<PaymentMethodType>(params.get('method'), METHOD_IDS),
    sort: parseSort(params.get('sort')),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? (size as PageSize) : DEFAULT_QUERY.pageSize,
  };
}

/**
 * Writes a query as a flat record of search params (defaults omitted).
 * Returning a plain object lets each framework feed its own router API.
 */
export function serializeQuery(query: PaymentsQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.view !== 'all') params['view'] = query.view;
  if (query.search.trim()) params['q'] = query.search.trim();
  if (query.date) params['date'] = serializeDateFilter(query.date);
  if (query.amount) params['amount'] = serializeAmountFilter(query.amount);
  if (query.currencies.length) params['currency'] = query.currencies.join(',');
  if (query.statuses.length) params['status'] = query.statuses.join(',');
  if (query.methods.length) params['method'] = query.methods.join(',');
  if (query.sort.length) {
    params['sort'] = query.sort.map((rule) => `${rule.direction === 'desc' ? '-' : ''}${rule.column}`).join(',');
  }
  if (query.page > 1) params['page'] = String(query.page);
  if (query.pageSize !== DEFAULT_QUERY.pageSize) params['size'] = String(query.pageSize);
  return params;
}

/** `?status=failed&page=2`, or an empty string for the default query. */
export function toSearchString(query: PaymentsQuery): string {
  const search = new URLSearchParams(serializeQuery(query)).toString();
  return search ? `?${search}` : '';
}
