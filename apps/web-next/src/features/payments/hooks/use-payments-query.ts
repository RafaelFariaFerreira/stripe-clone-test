'use client';

import { parseQuery, toSearchString, type PaymentsQuery } from '@stripe-clone/domain';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';

/** Keys that change *which* rows match; changing any of them returns to page 1. */
const RESETS_PAGE: ReadonlyArray<keyof PaymentsQuery> = ['view', 'search', 'date', 'amount', 'currencies', 'statuses', 'methods', 'pageSize'];

/**
 * The Payments list state lives in the URL. This hook parses it with the shared
 * domain parser and writes updates back with `router.replace`, so every view
 * is shareable and the browser back button never fills up with keystrokes.
 *
 * Navigation is asynchronous: until the URL reflects the last update, further
 * updates build on that pending query instead of the (stale) URL, so quick
 * sequences such as "50 rows per page" then "Next" never lose a change.
 */
export function usePaymentsQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = searchParams.toString();

  const query = useMemo(() => parseQuery(new URLSearchParams(search)), [search]);
  const pending = useRef<PaymentsQuery | null>(null);

  // Once the URL has caught up with the pending update, the URL is the source of truth again.
  useEffect(() => {
    if (pending.current && toSearchString(pending.current) === (search ? `?${search}` : '')) pending.current = null;
  }, [search]);

  const setQuery = useCallback(
    (patch: Partial<PaymentsQuery>) => {
      const next: PaymentsQuery = { ...(pending.current ?? query), ...patch };
      if (RESETS_PAGE.some((key) => key in patch) && !('page' in patch)) next.page = 1;
      pending.current = next;
      router.replace(`${pathname}${toSearchString(next)}`, { scroll: false });
    },
    [query, router, pathname],
  );

  /** Clears every filter and the search, keeping the view card, sort and page size. */
  const clearFilters = useCallback(() => {
    setQuery({ date: null, amount: null, currencies: [], statuses: [], methods: [], search: '' });
  }, [setQuery]);

  return { query, setQuery, clearFilters };
}
