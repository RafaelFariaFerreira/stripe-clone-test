'use client';

import { CURRENCY_LABEL, formatMoney, getSortState, type Payment, type SortColumn, type SortRule } from '@stripe-clone/domain';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/feedback';
import { cx } from '@/lib/cx';
import { prefetchPaymentDetails } from '../../api/queries';
import { COLUMNS, SELECTABLE_STATUSES, type ColumnDefinition, type ColumnId } from '../../columns';
import { CopyableId, CreatedCell, EmptyValue, OptionalDate, PaymentMethodCell } from './cells';
import { RowActions } from './row-actions';

interface PaymentsTableProps {
  rows: readonly Payment[];
  visibleColumns: ReadonlySet<ColumnId>;
  sort: readonly SortRule[];
  onSort: (column: SortColumn, additive: boolean) => void;
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
}

/**
 * The payments table. Uses real table semantics; each row navigates to the
 * details page on click, while the amount cell holds the keyboard-accessible
 * link so there are no nested interactive elements.
 */
export function PaymentsTable({ rows, visibleColumns, sort, onSort, selected, onSelectedChange }: PaymentsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const columns = COLUMNS.filter((column) => visibleColumns.has(column.id));

  const selectable = rows.filter((row) => SELECTABLE_STATUSES.has(row.status));
  const selectedOnPage = selectable.filter((row) => selected.has(row.id)).length;
  const allSelected = selectable.length > 0 && selectedOnPage === selectable.length;

  const toggleAll = () => {
    const next = new Set(selected);
    for (const row of selectable) {
      if (allSelected) next.delete(row.id);
      else next.add(row.id);
    }
    onSelectedChange(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  };

  const openRow = (event: MouseEvent<HTMLTableRowElement>, id: string) => {
    // Let buttons, links and checkboxes inside the row do their own thing.
    if ((event.target as HTMLElement).closest('a, button, input, label')) return;
    if (window.getSelection()?.toString()) return;
    router.push(`/payments/${id}`);
  };

  const warm = (id: string) => {
    prefetchPaymentDetails(queryClient, id);
    router.prefetch(`/payments/${id}`);
  };

  return (
    <table className="data-table">
      <caption className="sr-only">Payments</caption>
      <TableColGroup columns={columns} />
      <thead>
        <tr>
          <th scope="col" className="data-table__head-cell cell-select">
            <Checkbox
              name="select-all-payments"
              aria-label="Select all payments on this page"
              checked={allSelected}
              indeterminate={selectedOnPage > 0 && !allSelected}
              disabled={selectable.length === 0}
              onChange={toggleAll}
            />
          </th>
          {columns.map((column) => (
            <HeaderCell key={column.id} column={column} sort={sort} onSort={onSort} />
          ))}
          <th scope="col" className="data-table__head-cell cell-actions">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((payment) => {
          const canSelect = SELECTABLE_STATUSES.has(payment.status);
          return (
            <tr
              key={payment.id}
              className="data-table__row"
              aria-selected={selected.has(payment.id) || undefined}
              onClick={(event) => openRow(event, payment.id)}
              onMouseEnter={() => warm(payment.id)}
            >
              <td className="data-table__cell cell-select">
                <Checkbox
                  name="selected-payments"
                  value={payment.id}
                  aria-label={`Select payment ${payment.id}`}
                  checked={selected.has(payment.id)}
                  disabled={!canSelect}
                  onChange={() => toggleRow(payment.id)}
                />
              </td>
              {columns.map((column) => (
                <BodyCell key={column.id} column={column.id} payment={payment} onFocusLink={() => warm(payment.id)} />
              ))}
              <td className="data-table__cell cell-actions">
                <RowActions payment={payment} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TableColGroup({ columns }: { columns: readonly ColumnDefinition[] }) {
  return (
    <colgroup>
      <col className="col-select" />
      {columns.map((column) => (
        <col key={column.id} className={`col-${column.id}`} />
      ))}
      <col className="col-actions" />
    </colgroup>
  );
}

function HeaderCell({ column, sort, onSort }: { column: ColumnDefinition; sort: readonly SortRule[]; onSort: PaymentsTableProps['onSort'] }) {
  const right = column.align === 'right';
  const className = cx('data-table__head-cell', right && 'data-table__head-cell--right', column.id === 'currency' && 'cell-currency');
  if (!column.sortKey) {
    return (
      <th scope="col" className={className}>
        {column.header || <span className="sr-only">{column.name}</span>}
      </th>
    );
  }
  const state = getSortState(sort, column.sortKey);
  const ariaSort = state?.priority === 1 ? (state.direction === 'asc' ? 'ascending' : 'descending') : undefined;
  const sortKey = column.sortKey;
  return (
    <th scope="col" className={className} aria-sort={ariaSort}>
      <button
        type="button"
        className="sort-button"
        title={`Sort by ${column.name.toLowerCase()} (Shift+click to add a secondary sort)`}
        onClick={(event) => onSort(sortKey, event.shiftKey)}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            onSort(sortKey, true);
          }
        }}
      >
        {column.header ? <span>{column.header}</span> : <span className="sr-only">{column.name}</span>}
        <span className={cx('sort-button__indicator', !state && 'sort-button__indicator--idle')} aria-hidden="true">
          <Icon name={state?.direction === 'asc' ? 'arrow-up' : 'arrow-down'} size={8} />
          {state && sort.length > 1 ? state.priority : null}
        </span>
        {state ? <span className="sr-only">, sorted {state.direction === 'asc' ? 'ascending' : 'descending'}</span> : null}
      </button>
    </th>
  );
}

function BodyCell({ column, payment, onFocusLink }: { column: ColumnId; payment: Payment; onFocusLink: () => void }) {
  switch (column) {
    case 'amount':
      return (
        <td className="data-table__cell cell-amount">
          <Link href={`/payments/${payment.id}`} className="tabular-nums" onFocus={onFocusLink}>
            {formatMoney(payment.amount, payment.currency)}
          </Link>
        </td>
      );
    case 'currency':
      return <td className="data-table__cell cell-currency">{CURRENCY_LABEL[payment.currency]}</td>;
    case 'status':
      return (
        <td className="data-table__cell cell-status">
          <StatusBadge status={payment.status} />
        </td>
      );
    case 'method':
      return (
        <td className="data-table__cell">
          <PaymentMethodCell method={payment.paymentMethod} />
        </td>
      );
    case 'description':
      return <td className="data-table__cell">{payment.description}</td>;
    case 'customer':
      return (
        <td className="data-table__cell" title={payment.customer.name ?? undefined}>
          {payment.customer.email}
        </td>
      );
    case 'date':
      return (
        <td className="data-table__cell">
          <CreatedCell iso={payment.created} />
        </td>
      );
    case 'refunded':
      return (
        <td className="data-table__cell">
          <OptionalDate iso={payment.refundedAt} />
        </td>
      );
    case 'decline':
      return (
        <td className="data-table__cell" title={payment.declineReason ?? undefined}>
          {payment.declineReason ?? <EmptyValue />}
        </td>
      );
    case 'id':
      return (
        <td className="data-table__cell">
          <CopyableId id={payment.id} />
        </td>
      );
  }
}

/** Loading placeholder: same columns and row height as the real table (no layout shift). */
export function PaymentsTableSkeleton({ rows = 10 }: { rows?: number }) {
  const widths = [52, 30, 74, 92, 120, 170, 104, 16, 16, 96];
  return (
    <table className="data-table" aria-busy="true" aria-label="Loading payments">
      <TableColGroup columns={COLUMNS} />
      <thead>
        <tr>
          <th className="data-table__head-cell cell-select">
            <Checkbox disabled aria-hidden="true" tabIndex={-1} />
          </th>
          {COLUMNS.map((column) => (
            <th key={column.id} className={cx('data-table__head-cell', column.align === 'right' && 'data-table__head-cell--right')}>
              {column.header}
            </th>
          ))}
          <th className="data-table__head-cell cell-actions" />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row} className="skeleton-row">
            <td className="data-table__cell cell-select">
              <Skeleton width={16} height={16} />
            </td>
            {COLUMNS.map((column, index) => (
              <td key={column.id} className={cx('data-table__cell', column.align === 'right' && 'cell-amount')}>
                <Skeleton width={widths[index] ?? 60} />
              </td>
            ))}
            <td className="data-table__cell cell-actions" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
