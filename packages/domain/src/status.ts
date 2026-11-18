import type { PaymentStatus } from './types';

/** Visual tone of a badge. Each tone maps to one color triplet in the design tokens. */
export type BadgeTone = 'success' | 'danger' | 'warning' | 'neutral';

/** Names of the 12 px glyphs drawn next to the badge label (see `@stripe-clone/icons`). */
export type StatusIcon = 'check' | 'cross' | 'blocked' | 'refund' | 'clock' | 'alert';

export interface StatusMeta {
  /** Badge text, verbatim from the Dashboard. */
  label: string;
  tone: BadgeTone;
  icon: StatusIcon;
  /**
   * Position used when sorting by status. Follows the payment lifecycle so an
   * ascending sort reads "in progress → done → problems".
   */
  sortOrder: number;
}

/**
 * Single source of truth for how a status looks and sorts.
 * Components never hard-code status colors or labels.
 */
export const STATUS_META: Readonly<Record<PaymentStatus, StatusMeta>> = {
  incomplete: { label: 'Incomplete', tone: 'neutral', icon: 'clock', sortOrder: 0 },
  pending: { label: 'Pending', tone: 'neutral', icon: 'clock', sortOrder: 1 },
  uncaptured: { label: 'Uncaptured', tone: 'neutral', icon: 'clock', sortOrder: 2 },
  succeeded: { label: 'Succeeded', tone: 'success', icon: 'check', sortOrder: 3 },
  partially_refunded: { label: 'Partial refund', tone: 'neutral', icon: 'refund', sortOrder: 4 },
  refunded: { label: 'Refunded', tone: 'neutral', icon: 'refund', sortOrder: 5 },
  disputed: { label: 'Disputed', tone: 'warning', icon: 'alert', sortOrder: 6 },
  canceled: { label: 'Canceled', tone: 'neutral', icon: 'cross', sortOrder: 7 },
  failed: { label: 'Failed', tone: 'danger', icon: 'cross', sortOrder: 8 },
  blocked: { label: 'Blocked', tone: 'danger', icon: 'blocked', sortOrder: 9 },
};

/** Statuses in the order the Status filter lists them (alphabetical, like Stripe). */
export const STATUS_FILTER_OPTIONS: readonly PaymentStatus[] = (
  Object.keys(STATUS_META) as PaymentStatus[]
).sort((a, b) => STATUS_META[a].label.localeCompare(STATUS_META[b].label));

/**
 * The quick-filter cards above the table. Each card is a preset over statuses;
 * `all` applies no status constraint.
 */
export type PaymentsView = 'all' | 'succeeded' | 'refunded' | 'disputed' | 'failed' | 'uncaptured';

export interface ViewMeta {
  id: PaymentsView;
  label: string;
  statuses: readonly PaymentStatus[] | null;
}

export const PAYMENT_VIEWS: readonly ViewMeta[] = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'succeeded', label: 'Succeeded', statuses: ['succeeded'] },
  { id: 'refunded', label: 'Refunded', statuses: ['refunded', 'partially_refunded'] },
  { id: 'disputed', label: 'Disputed', statuses: ['disputed'] },
  { id: 'failed', label: 'Failed', statuses: ['failed'] },
  { id: 'uncaptured', label: 'Uncaptured', statuses: ['uncaptured'] },
];
