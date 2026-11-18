import type { Payment, PaymentDetails } from './types';

/**
 * Data access contract implemented by each app (HTTP fetch of the mock JSON).
 * Keeping it this small means a real API only needs a new adapter.
 */
export interface PaymentsRepository {
  /** The whole list dataset. Filtering, sorting and paging happen client-side. */
  list(): Promise<Payment[]>;
  /** Details for one payment, loaded lazily by the details page. */
  details(id: string): Promise<PaymentDetails | null>;
}

/** Shape of the generated `payments.json`. */
export interface PaymentsDataset {
  /** Bumped whenever the generator output changes; used to invalidate caches. */
  version: number;
  /** ISO timestamp the relative dates were generated against. */
  anchor: string;
  payments: Payment[];
}

/** Shape of one generated `details/<shard>.json` file. */
export type PaymentDetailsShard = Record<string, PaymentDetails>;

/** Number of detail shard files. Details are split so one visit downloads ~1/16 of them. */
export const DETAIL_SHARD_COUNT = 16;

/** Deterministic shard index for a payment id (FNV-1a hash). */
export function detailShardOf(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % DETAIL_SHARD_COUNT;
}

/**
 * Shifts every timestamp of the dataset so the newest payment happened just
 * now. The mock data is generated once against a fixed anchor; rebasing at load
 * time keeps "Today" non-empty and relative times plausible on any day.
 */
export function rebaseDataset(dataset: PaymentsDataset, now: Date = new Date()): Payment[] {
  const offset = now.getTime() - Date.parse(dataset.anchor);
  const shift = (iso: string | null) => (iso ? new Date(Date.parse(iso) + offset).toISOString() : null);
  return dataset.payments.map((payment) => ({
    ...payment,
    created: shift(payment.created) ?? payment.created,
    refundedAt: shift(payment.refundedAt),
    disputeDueBy: shift(payment.disputeDueBy),
  }));
}

/** Same rebasing for a details record, using the dataset anchor. */
export function rebaseDetails(details: PaymentDetails, anchor: string, now: Date = new Date()): PaymentDetails {
  const offset = now.getTime() - Date.parse(anchor);
  const shift = (iso: string) => new Date(Date.parse(iso) + offset).toISOString();
  return {
    ...details,
    updatedAt: shift(details.updatedAt),
    fundsAvailableAt: details.fundsAvailableAt ? shift(details.fundsAvailableAt) : null,
    timeline: details.timeline.map((entry) => ({ ...entry, at: shift(entry.at) })),
    events: details.events.map((event) => ({ ...event, at: shift(event.at) })),
    logs: details.logs.map((log) => ({ ...log, at: shift(log.at) })),
  };
}
