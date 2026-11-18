import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentsTableSkeleton } from '@/features/payments/components/table/payments-table';
import { SearchResultsView } from '@/features/search/components/search-results-view';

export const metadata: Metadata = { title: 'Search' };

/** Search results page: the URL-driven view streams in inside Suspense. */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="search-page">
          <div className="search-page__header">
            <h1 className="search-page__title">Search results: Payments</h1>
          </div>
          <div className="table-scroll search-page__table">
            <PaymentsTableSkeleton rows={7} />
          </div>
        </div>
      }
    >
      <SearchResultsView />
    </Suspense>
  );
}
