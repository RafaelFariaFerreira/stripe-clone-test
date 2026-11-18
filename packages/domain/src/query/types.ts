import type { PaymentsView } from '../status';
import type { CurrencyCode, PaymentMethodType, PaymentStatus } from '../types';

/** Quick presets required by the brief, plus a custom inclusive day range. */
export type DateFilter =
  | { preset: 'today' }
  | { preset: 'last_7_days' }
  | { preset: 'last_30_days' }
  | { preset: 'custom'; from: string; to: string };

export type DatePreset = DateFilter['preset'];

/** Operators offered by the Dashboard's Amount filter. Values are major units. */
export type AmountFilter =
  | { operator: 'eq'; value: number }
  | { operator: 'gt'; value: number }
  | { operator: 'lt'; value: number }
  | { operator: 'between'; value: number; valueTo: number };

export type AmountOperator = AmountFilter['operator'];

export type SortColumn = 'created' | 'amount' | 'status' | 'customer';
export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  column: SortColumn;
  direction: SortDirection;
}

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/**
 * The complete UI state of the Payments list. It is the only state the table
 * needs and it round-trips through the URL (see `url.ts`), so every view of
 * the table is a shareable link.
 */
export interface PaymentsQuery {
  view: PaymentsView;
  /** Free text matched against payment ID, customer email and last 4 digits. */
  search: string;
  date: DateFilter | null;
  amount: AmountFilter | null;
  currencies: CurrencyCode[];
  statuses: PaymentStatus[];
  methods: PaymentMethodType[];
  /** Ordered: the first rule is the primary sort. Empty means "newest first". */
  sort: SortRule[];
  /** 1-based page index. */
  page: number;
  pageSize: PageSize;
}

export const DEFAULT_QUERY: Readonly<PaymentsQuery> = Object.freeze({
  view: 'all',
  search: '',
  date: null,
  amount: null,
  currencies: [],
  statuses: [],
  methods: [],
  sort: [],
  page: 1,
  pageSize: 25,
});

/** Result of running a query against the dataset. */
export interface QueryResult<T> {
  /** Rows of the requested page. */
  rows: T[];
  /** Number of rows matching every filter (before pagination). */
  total: number;
  /** Page actually returned (clamped to the available range). */
  page: number;
  pageCount: number;
  /** 1-based index of the first row on the page (0 when empty). */
  rangeStart: number;
  /** 1-based index of the last row on the page (0 when empty). */
  rangeEnd: number;
}
