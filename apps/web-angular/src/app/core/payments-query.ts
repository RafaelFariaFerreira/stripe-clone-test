import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { parseQuery, serializeQuery, type PaymentsQuery } from '@stripe-clone/domain';

/** Keys that change *which* rows match; changing any of them returns to page 1. */
const RESETS_PAGE: ReadonlyArray<keyof PaymentsQuery> = ['view', 'search', 'date', 'amount', 'currencies', 'statuses', 'methods', 'pageSize'];

/**
 * The Payments list state lives in the URL. Parses it with the shared domain
 * parser and writes updates back with `replaceUrl`, so every view is a
 * shareable link and Back doesn't fill up with intermediate states.
 *
 * Navigation is asynchronous: while an update is in flight, further updates
 * build on it instead of the not-yet-updated URL, so quick sequences such as
 * "50 rows per page" then "Next" never lose a change.
 *
 * Must be called in an injection context of a routed component.
 */
export function injectPaymentsQuery() {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const params = toSignal(route.queryParamMap, { requireSync: true });

  const query = computed(() => {
    const map = params();
    return parseQuery({ get: (name) => map.get(name) });
  });

  let pending: PaymentsQuery | null = null;
  let ticket = 0;

  const setQuery = (patch: Partial<PaymentsQuery>) => {
    const next: PaymentsQuery = { ...(pending ?? query()), ...patch };
    if (RESETS_PAGE.some((key) => key in patch) && !('page' in patch)) next.page = 1;
    pending = next;
    const current = ++ticket;
    void router.navigate([], { relativeTo: route, queryParams: serializeQuery(next), replaceUrl: true }).finally(() => {
      // Only the latest navigation releases the pending state.
      if (current === ticket) pending = null;
    });
  };

  /** Clears every filter and the search, keeping view card, sort and page size. */
  const clearFilters = () => setQuery({ date: null, amount: null, currencies: [], statuses: [], methods: [], search: '' });

  return { query, setQuery, clearFilters };
}
