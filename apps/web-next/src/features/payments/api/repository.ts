import {
  detailShardOf,
  type PaymentDetails,
  type PaymentDetailsShard,
  type PaymentsDataset,
} from '@stripe-clone/domain';

/**
 * HTTP access to the mock dataset served from `/public/data`.
 * The files are static and cacheable; the in-memory/persisted cache on top of
 * this lives in TanStack Query (see `queries.ts`).
 */

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

/** The list dataset (≈36 KB gzipped). Downloaded once, then served from cache. */
export function fetchPaymentsDataset(signal?: AbortSignal): Promise<PaymentsDataset> {
  return getJson<PaymentsDataset>('/data/payments.json', signal);
}

/** One details shard (~1/16 of all payments). Loaded only when a details page needs it. */
export function fetchDetailsShard(shard: number, signal?: AbortSignal): Promise<PaymentDetailsShard> {
  return getJson<PaymentDetailsShard>(`/data/details/${shard}.json`, signal);
}

export async function fetchPaymentDetails(id: string, signal?: AbortSignal): Promise<PaymentDetails | null> {
  const shard = await fetchDetailsShard(detailShardOf(id), signal);
  return shard[id] ?? null;
}
