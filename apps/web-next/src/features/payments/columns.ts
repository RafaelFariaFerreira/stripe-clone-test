import type { SortColumn } from '@stripe-clone/domain';

/**
 * Table columns in display order. Header text is copied from the reference;
 * columns without a visible header (currency code, status) keep an accessible
 * name for screen readers and sorting.
 */
export type ColumnId = 'amount' | 'currency' | 'status' | 'method' | 'description' | 'customer' | 'date' | 'refunded' | 'decline' | 'id';

export interface ColumnDefinition {
  id: ColumnId;
  /** Visible header label ('' when the reference shows none). */
  header: string;
  /** Name used by assistive tech and the "Edit columns" menu. */
  name: string;
  sortKey?: SortColumn;
  align?: 'left' | 'right';
  /** Whether "Edit columns" may hide it. */
  hideable: boolean;
}

export const COLUMNS: readonly ColumnDefinition[] = [
  { id: 'amount', header: 'Amount', name: 'Amount', sortKey: 'amount', align: 'right', hideable: false },
  { id: 'currency', header: '', name: 'Currency', hideable: false },
  { id: 'status', header: '', name: 'Status', sortKey: 'status', hideable: false },
  { id: 'method', header: 'Payment method', name: 'Payment method', hideable: true },
  { id: 'description', header: 'Description', name: 'Description', hideable: true },
  { id: 'customer', header: 'Customer', name: 'Customer', sortKey: 'customer', hideable: true },
  { id: 'date', header: 'Date', name: 'Date', sortKey: 'created', hideable: false },
  { id: 'refunded', header: 'Refunded date', name: 'Refunded date', hideable: true },
  { id: 'decline', header: 'Decline reason', name: 'Decline reason', hideable: true },
  { id: 'id', header: 'Payment ID', name: 'Payment ID', hideable: true },
];

export const DEFAULT_VISIBLE_COLUMNS: readonly ColumnId[] = COLUMNS.map((column) => column.id);

/** Statuses that can be selected for bulk actions (others render a disabled checkbox, as in the Dashboard). */
export const SELECTABLE_STATUSES = new Set(['succeeded', 'refunded', 'partially_refunded', 'disputed', 'uncaptured', 'pending']);
