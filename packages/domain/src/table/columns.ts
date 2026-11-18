import type { SortColumn } from '../query/types';

/**
 * The Payments table model, shared by both apps. Header text is copied from
 * the reference; columns without a visible header (currency code, status)
 * keep an accessible name for screen readers, sorting and "Edit columns".
 */
export type ColumnId = 'amount' | 'currency' | 'status' | 'method' | 'description' | 'customer' | 'date' | 'refunded' | 'decline' | 'id';

export interface ColumnDefinition {
  id: ColumnId;
  /** Visible header label ('' when the reference shows none). */
  header: string;
  /** Name used by assistive tech, "Edit columns" and the resize/reorder controls. */
  name: string;
  sortKey?: SortColumn;
  align?: 'left' | 'right';
  /** Whether "Edit columns" may hide it. */
  hideable: boolean;
  /** Width in px, measured on the reference (see the style guide). */
  defaultWidth: number;
  /** Smallest width the user can resize it to. */
  minWidth: number;
}

export const COLUMNS: readonly ColumnDefinition[] = [
  { id: 'amount', header: 'Amount', name: 'Amount', sortKey: 'amount', align: 'right', hideable: false, defaultWidth: 86, minWidth: 64 },
  { id: 'currency', header: '', name: 'Currency', hideable: false, defaultWidth: 38, minWidth: 38 },
  { id: 'status', header: '', name: 'Status', sortKey: 'status', hideable: false, defaultWidth: 110, minWidth: 80 },
  { id: 'method', header: 'Payment method', name: 'Payment method', hideable: true, defaultWidth: 140, minWidth: 96 },
  { id: 'description', header: 'Description', name: 'Description', hideable: true, defaultWidth: 154, minWidth: 80 },
  { id: 'customer', header: 'Customer', name: 'Customer', sortKey: 'customer', hideable: true, defaultWidth: 265, minWidth: 80 },
  { id: 'date', header: 'Date', name: 'Date', sortKey: 'created', hideable: false, defaultWidth: 132, minWidth: 80 },
  { id: 'refunded', header: 'Refunded date', name: 'Refunded date', hideable: true, defaultWidth: 132, minWidth: 80 },
  { id: 'decline', header: 'Decline reason', name: 'Decline reason', hideable: true, defaultWidth: 160, minWidth: 80 },
  { id: 'id', header: 'Payment ID', name: 'Payment ID', hideable: true, defaultWidth: 150, minWidth: 96 },
];

export const COLUMN_BY_ID: Readonly<Record<ColumnId, ColumnDefinition>> = Object.fromEntries(
  COLUMNS.map((column) => [column.id, column]),
) as Record<ColumnId, ColumnDefinition>;

export const DEFAULT_VISIBLE_COLUMNS: readonly ColumnId[] = COLUMNS.map((column) => column.id);

/** Fixed columns around the data columns: row checkbox and the sticky ⋯ menu. */
export const SELECT_COLUMN_WIDTH = 36;
export const ACTIONS_COLUMN_WIDTH = 40;

/** Largest width a column can be resized to. */
export const MAX_COLUMN_WIDTH = 640;

/** Statuses that can be selected for bulk actions (others render a disabled checkbox, as in the Dashboard). */
export const SELECTABLE_STATUSES: ReadonlySet<string> = new Set([
  'succeeded',
  'refunded',
  'partially_refunded',
  'disputed',
  'uncaptured',
  'pending',
]);
