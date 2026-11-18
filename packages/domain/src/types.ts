/**
 * Core payment types shared by both apps and the mock-data generator.
 *
 * The shapes intentionally mirror the subset of Stripe's PaymentIntent that the
 * Payments table and the payment details page display, so swapping the mock
 * repository for a real API later only requires an adapter.
 */

/** ISO 4217 currency codes present in the mock dataset (lowercase, like Stripe). */
export type CurrencyCode = 'usd' | 'gbp' | 'eur' | 'brl' | 'cad' | 'aud' | 'jpy';

/**
 * Lifecycle states rendered as badges. The four required by the brief are
 * `succeeded`, `pending`, `failed` and `refunded`; the others appear in the
 * reference screenshot and make the table look like a real account.
 */
export type PaymentStatus =
  | 'succeeded'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'canceled'
  | 'blocked'
  | 'uncaptured'
  | 'disputed'
  | 'incomplete';

/** Top-level payment method families, used by the "Payment method" filter. */
export type PaymentMethodType = 'card' | 'ach_debit' | 'wallet';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover';

/** Wallets always tokenize a card, so a wallet payment still has a brand and last 4. */
export type WalletType = 'apple_pay' | 'google_pay' | 'link';

export interface PaymentMethod {
  type: PaymentMethodType;
  /** Present for `card` and `wallet`. */
  brand?: CardBrand;
  /** Present for `wallet`. */
  wallet?: WalletType;
  /** Present for `ach_debit`. */
  bankName?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
}

export interface Customer {
  id: string;
  name: string | null;
  email: string;
}

/** One row of the Payments table. Everything the list needs, nothing more. */
export interface Payment {
  /** PaymentIntent id, e.g. `pi_3UdA4wL2cI6mqjNa0fxt9wsQ`. */
  id: string;
  /** Amount in the currency's minor unit (cents), like the Stripe API. */
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description: string;
  customer: Customer;
  /** ISO 8601 timestamp (UTC). */
  created: string;
  refundedAt: string | null;
  /** Amount refunded in minor units (0 when nothing was refunded). */
  amountRefunded: number;
  /** Human readable decline reason, only for failed/blocked payments. */
  declineReason: string | null;
  /** Evidence due date, only for disputed payments. */
  disputeDueBy: string | null;
}

/** A single entry in the "Recent activity" timeline of the details page. */
export interface TimelineEntry {
  label: string;
  at: string;
  /** The newest entry is highlighted with a filled dot. */
  current: boolean;
}

/** An API event as listed in the "Events" section of the details page. */
export interface PaymentEvent {
  id: string;
  description: string;
  at: string;
}

/** A request log line as listed in the "Logs" section of the details page. */
export interface RequestLog {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  status: number;
  at: string;
}

/**
 * Data only the details page needs. It is stored apart from {@link Payment}
 * and fetched lazily, so the list payload stays small.
 */
export interface PaymentDetails {
  paymentId: string;
  chargeId: string;
  paymentMethodId: string;
  fingerprint: string;
  fee: number;
  net: number;
  riskLevel: 'normal' | 'elevated' | 'highest';
  riskScore: number;
  statementDescriptor: string;
  fundsAvailableAt: string | null;
  updatedAt: string;
  issuer: string;
  origin: string;
  cvcCheck: 'Passed' | 'Failed' | 'Unavailable';
  timeline: TimelineEntry[];
  events: PaymentEvent[];
  logs: RequestLog[];
  metadata: Record<string, string>;
}
