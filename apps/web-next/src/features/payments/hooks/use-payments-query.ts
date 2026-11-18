'use client';

import { DEFAULT_QUERY, parseQuery, toSearchString, type PaymentsQuery } from '@stripe-clone/domain';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/** Keys that change *which* rows match; changing any of them returns to page 1. */
const RESETS_PAGE: ReadonlyArray<keyof PaymentsQuery> = ['view', 'search', 'date', 'amount', 'currencies', 'statuses', 'methods', 'pageSize'];

/**
 * The Payments list state lives in the URL. This hook parses it with the shared
 * domain parser and writes updates back with `router.replace`, so every view
 * is shareable and the browser back button never fills up with keystrokes.
 */
export function usePaymentsQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = searchParams.toString();

  const query = useMemo(() => parseQuery(new URLSearchParams(search)), [search]);

  const setQuery = useCallback(
    (patch: Partial<PaymentsQuery>) => {
      const next: PaymentsQuery = { ...query, ...patch };
      if (RESETS_PAGE.some((key) => key in patch) && !('page' in patch)) next.page = 1;
      router.replace(`${pathname}${toSearchString(next)}`, { scroll: false });
    },
    [query, router, pathname],
  );

  /** Clears every filter but keeps the view card, sort and page size. */
  const clearFilters = useCallback(() => {
    setQuery({ date: null, amount: null, currencies: [], statuses: [], methods: [], search: '' });
  }, [setQuery]);

  const reset = useCallback(() => router.replace(`${pathname}${toSearchString(DEFAULT_QUERY)}`, { scroll: false }), [router, pathname]);

  return { query, setQuery, clearFilters, reset };
}
