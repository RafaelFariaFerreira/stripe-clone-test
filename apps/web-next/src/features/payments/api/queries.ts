'use client';

import {
  detailShardOf,
  rebaseDataset,
  rebaseDetails,
  type Payment,
  type PaymentDetails,
  type PaymentsDataset,
} from '@stripe-clone/domain';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchDetailsShard, fetchPaymentsDataset } from './repository';

/** Query keys in one place, so invalidation and prefetching never drift apart. */
export const paymentKeys = {
  dataset: ['payments', 'dataset'] as const,
  detailsShard: (shard: number) => ['payments', 'details-shard', shard] as const,
};

/**
 * Timestamps are rebased once per page load, so every component agrees on
 * "now" and relative times do not jump between renders.
 */
const SESSION_NOW = new Date();

/** The mock files never change at runtime: cache them for the whole session. */
const STATIC_DATA = { staleTime: Number.POSITIVE_INFINITY, gcTime: 24 * 60 * 60 * 1000 } as const;

function datasetQueryOptions() {
  return {
    queryKey: paymentKeys.dataset,
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchPaymentsDataset(signal),
    ...STATIC_DATA,
  };
}

function detailsShardQueryOptions(shard: number) {
  return {
    queryKey: paymentKeys.detailsShard(shard),
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchDetailsShard(shard, signal),
    ...STATIC_DATA,
  };
}

/** Raw dataset query: exposes loading/error state to the table. */
export function usePaymentsDataset() {
  return useQuery<PaymentsDataset>(datasetQueryOptions());
}

/** All payments, rebased to the current session. Memoized per dataset. */
export function usePayments(): { payments: Payment[] | undefined; anchor: string | undefined; status: 'pending' | 'error' | 'success'; refetch: () => void } {
  const query = usePaymentsDataset();
  const payments = useMemo(() => (query.data ? rebaseDataset(query.data, SESSION_NOW) : undefined), [query.data]);
  return { payments, anchor: query.data?.anchor, status: query.status, refetch: () => void query.refetch() };
}

/** Details for one payment, loaded lazily from its shard and rebased like the list. */
export function usePaymentDetails(id: string) {
  const dataset = usePaymentsDataset();
  const shard = useQuery(detailsShardQueryOptions(detailShardOf(id)));
  const details = useMemo<PaymentDetails | null | undefined>(() => {
    if (!shard.data || !dataset.data) return undefined;
    const record = shard.data[id];
    return record ? rebaseDetails(record, dataset.data.anchor, SESSION_NOW) : null;
  }, [shard.data, dataset.data, id]);
  return { details, status: shard.status === 'error' || dataset.status === 'error' ? 'error' : details === undefined ? 'pending' : 'success', refetch: () => void shard.refetch() } as const;
}

/** Warms the cache when the pointer rests on a row, so the details page opens instantly. */
export function prefetchPaymentDetails(queryClient: QueryClient, id: string): void {
  void queryClient.prefetchQuery(detailsShardQueryOptions(detailShardOf(id)));
}
