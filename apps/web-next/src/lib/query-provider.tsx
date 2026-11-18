'use client';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { useState, type ReactNode } from 'react';

/** Bump to invalidate every persisted cache entry after a data/schema change. */
const CACHE_BUSTER = 'payments-v1';

/**
 * React Query client with an IndexedDB-backed persister: the dataset and any
 * detail shard already seen are restored instantly on the next visit, then
 * kept in memory for the session.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 2 },
        },
      }),
  );
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: typeof window === 'undefined' ? undefined : { getItem: get, setItem: set, removeItem: del },
      key: 'stripe-clone-query-cache',
    }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        buster: CACHE_BUSTER,
        maxAge: 24 * 60 * 60 * 1000,
        dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.status === 'success' && query.queryKey[0] === 'payments' },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
