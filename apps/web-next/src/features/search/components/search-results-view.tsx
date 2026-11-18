'use client';

import {
  clearSearchFilters,
  countSearchFilters,
  CURRENCY_LABEL,
  formatMoney,
  getSearchSort,
  isUncollected,
  paymentsToCsv,
  searchAllPayments,
  SEARCH_PAGE_SIZE,
  SEARCH_SORT_OPTIONS,
  paginate,
  toggleSearchSort,
  withSearchSort,
  writeSearchFilterPanel,
  type Payment,
  type SearchSort,
} from '@stripe-clone/domain';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, type MouseEvent } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuDivider, MenuItem, MenuLabel } from '@/components/ui/menu';
import { Popover } from '@/components/ui/popover';
import { prefetchPaymentDetails, usePayments } from '@/features/payments/api/queries';
import { PaymentsTableSkeleton } from '@/features/payments/components/table/payments-table';
import { CreatedCell, PaymentMethodCell } from '@/features/payments/components/table/cells';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';
import { useHydrated } from '@/lib/use-hydrated';
import { FiltersPanel } from './filters-panel';

/**
 * Search results page (`/search?query=…`), modelled on the Dashboard's. The
 * query text is the whole state: the sort select and the Filters panel
 * rewrite it (`sort:-amount`, `is:paid`, `date:…`), so every view is a link.
 */
export function SearchResultsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { payments: loaded, status } = usePayments();
  const payments = hydrated ? loaded : undefined;

  const query = searchParams.get('query') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const matching = useMemo(() => (payments ? searchAllPayments(payments, query) : []), [payments, query]);
  const result = useMemo(() => paginate(matching, page, SEARCH_PAGE_SIZE), [matching, page]);
  const filterCount = countSearchFilters(query);
  const sort = getSearchSort(query);

  const navigate = (nextQuery: string, nextPage = 1) => {
    const params = new URLSearchParams({ query: nextQuery.trim() });
    if (nextPage > 1) params.set('page', String(nextPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const loading = !payments && status !== 'error';
  const empty = Boolean(payments) && result.total === 0;

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">{empty ? 'Search results' : 'Search results: Payments'}</h1>
        <div className="search-page__actions">
          <Popover
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            placement="bottom-end"
            label="Filters"
            trigger={(props) => (
              <button type="button" className="button button--secondary" aria-haspopup="dialog" {...props}>
                <Icon name="filter" size={12} />
                <span>Filter</span>
                {filterCount ? <span className="filter-count">{filterCount}</span> : null}
              </button>
            )}
          >
            <FiltersPanel
              query={query}
              onApply={(panel) => {
                setFiltersOpen(false);
                navigate(writeSearchFilterPanel(query, panel));
              }}
              onClear={() => {
                setFiltersOpen(false);
                navigate(clearSearchFilters(query));
              }}
            />
          </Popover>
          <label className="sr-only" htmlFor="search-sort">
            Sort results
          </label>
          <select
            id="search-sort"
            name="sort"
            className="select select--button"
            value={sort}
            onChange={(event) => navigate(withSearchSort(query, event.target.value as SearchSort))}
          >
            {SEARCH_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {!empty ? (
            <button type="button" className="button button--secondary" disabled={!matching.length} onClick={() => downloadCsv(matching)}>
              <Icon name="export" size={12} />
              <span>Export</span>
            </button>
          ) : null}
        </div>
      </div>

      {status === 'error' ? (
        <div className="state-box" role="alert">
          <p className="state-box__title">We couldn&apos;t load your payments. Check your connection and try again.</p>
        </div>
      ) : loading ? (
        <div className="table-scroll search-page__table">
          <PaymentsTableSkeleton rows={7} />
        </div>
      ) : empty ? (
        <div className="search-empty" role="status">
          <Icon name="search" size={16} />
          <p className="search-empty__title">No search results found</p>
          <p className="search-empty__text">
            Please try again with a different query or{' '}
            <button type="button" className="link" onClick={() => navigate(clearSearchFilters(query))}>
              clear your filters
            </button>
          </p>
          <a
            className="link search-empty__support"
            href={`https://support.stripe.com/search?q=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
          >
            Search the support site
          </a>
        </div>
      ) : (
        <>
          <div className="table-scroll search-page__table" tabIndex={0} role="region" aria-label="Search results">
            <ResultsTable rows={result.rows} sort={sort} onSort={(column) => navigate(toggleSearchSort(query, column))} />
          </div>
          <nav className="search-page__footer" aria-label="Pagination">
            <span aria-live="polite">
              {result.total} {result.total === 1 ? 'item' : 'items'}
            </span>
            <span className="search-page__pager">
              <button
                type="button"
                className="button button--secondary button--sm"
                disabled={result.page <= 1}
                onClick={() => navigate(query, result.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="button button--secondary button--sm"
                disabled={result.page >= result.pageCount}
                onClick={() => navigate(query, result.page + 1)}
              >
                Next
              </button>
            </span>
          </nav>
        </>
      )}
    </div>
  );
}

function downloadCsv(rows: readonly Payment[]) {
  const blob = new Blob([paymentsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `search-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface ResultsTableProps {
  rows: readonly Payment[];
  sort: SearchSort;
  onSort: (column: 'amount' | 'created') => void;
}

/** Results table: Amount | currency | status | Description | Customer | Payment method | Date | ⋯ */
function ResultsTable({ rows, sort, onSort }: ResultsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const openRow = (event: MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((event.target as HTMLElement).closest('a, button, input, label')) return;
    router.push(`/payments/${id}`);
  };

  const sortIcon = (column: 'amount' | 'created') => {
    const desc = column === 'amount' ? 'amount_desc' : 'newest';
    const asc = column === 'amount' ? 'amount_asc' : 'oldest';
    if (sort === desc) return <Icon name="arrow-down" size={8} />;
    if (sort === asc) return <Icon name="arrow-up" size={8} />;
    return <Icon name="chevron-updown" size={12} />;
  };
  const ariaSort = (column: 'amount' | 'created') =>
    sort === (column === 'amount' ? 'amount_desc' : 'newest')
      ? 'descending'
      : sort === (column === 'amount' ? 'amount_asc' : 'oldest')
        ? 'ascending'
        : undefined;

  return (
    <table className="data-table data-table--search">
      <caption className="sr-only">Payment search results</caption>
      <colgroup>
        {['select', 'amount', 'currency', 'status', 'description', 'customer', 'method', 'date', 'actions'].map((column) => (
          <col key={column} className={`col-search-${column}`} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className="data-table__head-cell cell-select">
            <Checkbox disabled aria-label="Select all results" name="select-all-results" />
          </th>
          <th scope="col" className="data-table__head-cell data-table__head-cell--right" aria-sort={ariaSort('amount')}>
            <button type="button" className="sort-button" onClick={() => onSort('amount')}>
              <span>Amount</span>
              <span className="sort-button__indicator" aria-hidden="true">
                {sortIcon('amount')}
              </span>
            </button>
          </th>
          <th scope="col" className="data-table__head-cell">
            <span className="sr-only">Currency</span>
          </th>
          <th scope="col" className="data-table__head-cell">
            <span className="sr-only">Status</span>
          </th>
          <th scope="col" className="data-table__head-cell">
            Description
          </th>
          <th scope="col" className="data-table__head-cell">
            Customer
          </th>
          <th scope="col" className="data-table__head-cell">
            Payment method
          </th>
          <th scope="col" className="data-table__head-cell" aria-sort={ariaSort('created')}>
            <button type="button" className="sort-button" onClick={() => onSort('created')}>
              <span>Date</span>
              <span className="sort-button__indicator" aria-hidden="true">
                {sortIcon('created')}
              </span>
            </button>
          </th>
          <th scope="col" className="data-table__head-cell cell-actions">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((payment) => (
          <tr
            key={payment.id}
            className="data-table__row"
            onClick={(event) => openRow(event, payment.id)}
            onMouseEnter={() => prefetchPaymentDetails(queryClient, payment.id)}
          >
            <td className="data-table__cell cell-select">
              <Checkbox disabled aria-label={`Select payment ${payment.id}`} name="selected-results" />
            </td>
            <td className={`data-table__cell cell-amount${isUncollected(payment) ? ' cell-amount--muted' : ''}`}>
              <Link href={`/payments/${payment.id}`} className="tabular-nums">
                {formatMoney(payment.amount, payment.currency)}
              </Link>
            </td>
            <td className="data-table__cell cell-currency">{CURRENCY_LABEL[payment.currency]}</td>
            <td className="data-table__cell cell-status">
              <StatusBadge status={payment.status} />
            </td>
            <td className="data-table__cell">{payment.description}</td>
            <td className="data-table__cell">{payment.customer.email}</td>
            <td className="data-table__cell">
              <PaymentMethodCell method={payment.paymentMethod} compact />
            </td>
            <td className="data-table__cell">
              <CreatedCell iso={payment.created} />
            </td>
            <td className="data-table__cell cell-actions">
              <ResultActions payment={payment} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Row menu: ACTIONS (Copy payment ID) and CONNECTIONS (View customer, View payment details). */
function ResultActions({ payment }: { payment: Payment }) {
  const router = useRouter();
  const { copy } = useCopyToClipboard();
  return (
    <Menu
      label={`More options for payment ${payment.id}`}
      trigger={(props) => (
        <button type="button" className="icon-button icon-button--sm" aria-label="More options" {...props}>
          <Icon name="more-horizontal" size={12} />
        </button>
      )}
    >
      <MenuLabel>Actions</MenuLabel>
      <MenuItem onSelect={() => void copy(payment.id)}>Copy payment ID</MenuItem>
      <MenuDivider />
      <MenuLabel>Connections</MenuLabel>
      <MenuItem onSelect={() => router.push(`/payments?q=${encodeURIComponent(payment.customer.email)}`)}>View customer →</MenuItem>
      <MenuItem onSelect={() => router.push(`/payments/${payment.id}`)}>View payment details →</MenuItem>
    </Menu>
  );
}
