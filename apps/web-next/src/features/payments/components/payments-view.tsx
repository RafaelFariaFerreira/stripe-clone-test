'use client';

import { filterAndSort, paginate, toggleSort } from '@stripe-clone/domain';
import { useEffect, useMemo, useState } from 'react';
import { useHorizontalOverflow } from '@/lib/use-horizontal-overflow';
import { useHydrated } from '@/lib/use-hydrated';
import { usePreference } from '@/lib/use-preference';
import { usePayments } from '../api/queries';
import { DEFAULT_VISIBLE_COLUMNS, type ColumnId } from '../columns';
import { usePaymentsQuery } from '../hooks/use-payments-query';
import { FilterBar } from './filters/filter-bar';
import { Pagination } from './pagination';
import { EmptyResults, LoadError } from './states';
import { StatusCards } from './status-cards';
import { TableActions } from './table-actions';
import { PaymentsTable, PaymentsTableSkeleton } from './table/payments-table';

const COLUMNS_KEY = 'payments.table.visible-columns';

/**
 * Interactive part of the Payments page: quick views, filters, table and
 * pagination. All state lives in the URL (see `usePaymentsQuery`); the dataset
 * is cached by TanStack Query and filtered in memory.
 */
export function PaymentsView() {
  const { query, setQuery, clearFilters } = usePaymentsQuery();
  const hydrated = useHydrated();
  const { payments: loadedPayments, status, refetch } = usePayments();
  // Render the loading state until hydration completes (see useHydrated).
  const payments = hydrated ? loadedPayments : undefined;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [columnPreference, setColumnPreference] = usePreference<ColumnId[]>(COLUMNS_KEY, [...DEFAULT_VISIBLE_COLUMNS]);
  const visibleColumns = useMemo(() => new Set(columnPreference), [columnPreference]);

  const matching = useMemo(() => (payments ? filterAndSort(payments, query) : []), [payments, query]);
  const result = useMemo(() => paginate(matching, query.page, query.pageSize), [matching, query.page, query.pageSize]);
  const { ref: scrollerRef, overflowing } = useHorizontalOverflow<HTMLDivElement>(Boolean(payments && result.total));

  // A shared link may point past the last page; normalise the URL quietly.
  useEffect(() => {
    if (payments && result.page !== query.page) setQuery({ page: result.page });
  }, [payments, result.page, query.page, setQuery]);

  const updateColumns = (next: Set<ColumnId>) => setColumnPreference([...next]);

  return (
    <>
      <StatusCards active={query.view} onSelect={(view) => setQuery({ view })} />

      <div className="filter-toolbar">
        <FilterBar query={query} setQuery={setQuery} onClearAll={clearFilters} />
        <TableActions rows={matching} visibleColumns={visibleColumns} onVisibleColumnsChange={updateColumns} />
      </div>

      {hydrated && status === 'error' ? (
        <LoadError onRetry={refetch} />
      ) : status === 'pending' || !payments ? (
        <div className="table-region">
          <div className="table-scroll">
            <PaymentsTableSkeleton />
          </div>
        </div>
      ) : result.total === 0 ? (
        <EmptyResults onClear={clearFilters} />
      ) : (
        <>
          <div className="table-region">
            <div
              ref={scrollerRef}
              className="table-scroll"
              data-overflowing={overflowing}
              tabIndex={0}
              role="region"
              aria-label="Payments table, scrolls horizontally"
            >
              <PaymentsTable
                rows={result.rows}
                visibleColumns={visibleColumns}
                sort={query.sort}
                onSort={(column, additive) => setQuery({ sort: toggleSort(query.sort, column, additive), page: 1 })}
                selected={selected}
                onSelectedChange={setSelected}
              />
            </div>
          </div>
          <Pagination
            result={result}
            pageSize={query.pageSize}
            onPageChange={(page) => setQuery({ page })}
            onPageSizeChange={(pageSize) => setQuery({ pageSize })}
          />
        </>
      )}
    </>
  );
}

/** Static fallback while URL params resolve on the client (keeps layout stable). */
export function PaymentsViewFallback() {
  return (
    <>
      <div className="status-cards" aria-hidden="true">
        {['All', 'Succeeded', 'Refunded', 'Disputed', 'Failed', 'Uncaptured'].map((label, index) => (
          <span key={label} className="status-card" aria-selected={index === 0}>
            {label}
          </span>
        ))}
      </div>
      <div className="filter-toolbar" aria-hidden="true" />
      <div className="table-region">
        <div className="table-scroll">
          <PaymentsTableSkeleton />
        </div>
      </div>
    </>
  );
}
