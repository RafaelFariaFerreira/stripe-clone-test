'use client';

import {
  COLUMN_BY_ID,
  COLUMNS,
  CURRENCY_LABEL,
  DEFAULT_COLUMN_LAYOUT,
  formatMoney,
  getSortState,
  SELECTABLE_STATUSES,
  tableMinWidth,
  visibleColumnOrder,
  type ColumnDefinition,
  type ColumnId,
  type ColumnLayout,
  type Payment,
  type SortColumn,
  type SortRule,
} from '@stripe-clone/domain';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { StatusBadge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/feedback';
import { cx } from '@/lib/cx';
import { prefetchPaymentDetails } from '../../api/queries';
import { CopyableId, CreatedCell, EmptyValue, OptionalDate, PaymentMethodCell } from './cells';
import { RowActions } from './row-actions';
import { useColumnInteractions } from './use-column-interactions';

interface PaymentsTableProps {
  rows: readonly Payment[];
  visibleColumns: ReadonlySet<ColumnId>;
  /** Column order and widths (resizable and reorderable from the header). */
  layout: ColumnLayout;
  onLayoutChange: (layout: ColumnLayout) => void;
  sort: readonly SortRule[];
  onSort: (column: SortColumn, additive: boolean) => void;
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
}

/**
 * The payments table. Uses real table semantics; each row navigates to the
 * details page on click, while the amount cell holds the keyboard-accessible
 * link so there are no nested interactive elements.
 *
 * Columns have explicit widths (`table-layout: fixed`) and a trailing filler
 * column takes any spare room, so resizing one column never moves the width
 * of its neighbours. See `useColumnInteractions` for resizing and reordering.
 */
export function PaymentsTable({
  rows,
  visibleColumns,
  layout,
  onLayoutChange,
  sort,
  onSort,
  selected,
  onSelectedChange,
}: PaymentsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const order = visibleColumnOrder(layout, visibleColumns);
  const columns = order.map((id) => COLUMN_BY_ID[id]);
  const interactions = useColumnInteractions({ layout, columns: order, onLayoutChange });

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
    <>
      <table className="data-table" style={{ minWidth: interactions.minTableWidth }} {...interactions.tableState}>
        <caption className="sr-only">Payments</caption>
        <TableColGroup columns={columns} widthOf={interactions.widthOf} />
        <thead {...interactions.headProps}>
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
              <HeaderCell
                key={column.id}
                column={column}
                sort={sort}
                onSort={onSort}
                cellProps={interactions.headerCellProps(column.id, column.header || column.name)}
                resizerProps={interactions.resizerProps(column.id, column.name)}
                onReorderKeyDown={(event) => interactions.onReorderKeyDown(column.id, event)}
              />
            ))}
            <th scope="col" className="data-table__head-cell cell-filler" aria-hidden="true" />
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
                  <BodyCell
                    key={column.id}
                    column={column.id}
                    payment={payment}
                    dragging={interactions.draggingId === column.id}
                    onFocusLink={() => warm(payment.id)}
                  />
                ))}
                <td className="data-table__cell cell-filler" />
                <td className="data-table__cell cell-actions">
                  <RowActions payment={payment} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {interactions.indicatorX !== null ? (
        <span className="column-drop-indicator" style={{ left: interactions.indicatorX }} aria-hidden="true" />
      ) : null}
      {interactions.ghost
        ? createPortal(
            <span className="column-drag-ghost" style={{ left: interactions.ghost.x, top: interactions.ghost.y }} aria-hidden="true">
              {interactions.ghost.label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function TableColGroup({ columns, widthOf }: { columns: readonly ColumnDefinition[]; widthOf: (id: ColumnId) => number }) {
  return (
    <colgroup>
      <col className="col-select" />
      {columns.map((column) => (
        <col key={column.id} style={{ width: widthOf(column.id) }} />
      ))}
      <col className="col-filler" />
      <col className="col-actions" />
    </colgroup>
  );
}

interface HeaderCellProps {
  column: ColumnDefinition;
  sort: readonly SortRule[];
  onSort: PaymentsTableProps['onSort'];
  cellProps: ReturnType<ReturnType<typeof useColumnInteractions>['headerCellProps']>;
  resizerProps: ReturnType<ReturnType<typeof useColumnInteractions>['resizerProps']>;
  onReorderKeyDown: (event: KeyboardEvent) => boolean;
}

function HeaderCell({ column, sort, onSort, cellProps, resizerProps, onReorderKeyDown }: HeaderCellProps) {
  const right = column.align === 'right';
  const className = cx('data-table__head-cell', right && 'data-table__head-cell--right', column.id === 'currency' && 'cell-currency');
  const resizer = <span {...resizerProps} />;
  if (!column.sortKey) {
    return (
      <th scope="col" className={className} {...cellProps}>
        {column.header || <span className="sr-only">{column.name}</span>}
        {resizer}
      </th>
    );
  }
  const state = getSortState(sort, column.sortKey);
  const ariaSort = state?.priority === 1 ? (state.direction === 'asc' ? 'ascending' : 'descending') : undefined;
  const sortKey = column.sortKey;
  return (
    <th scope="col" className={className} aria-sort={ariaSort} {...cellProps}>
      <button
        type="button"
        className="sort-button"
        title={`Sort by ${column.name.toLowerCase()} (Shift+click to add a secondary sort, Alt+arrows to move the column)`}
        onClick={(event) => onSort(sortKey, event.shiftKey)}
        onKeyDown={(event: KeyboardEvent) => {
          if (onReorderKeyDown(event)) return;
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
      {resizer}
    </th>
  );
}

function BodyCell({
  column,
  payment,
  dragging,
  onFocusLink,
}: {
  column: ColumnId;
  payment: Payment;
  dragging: boolean;
  onFocusLink: () => void;
}) {
  const drag = dragging ? true : undefined;
  switch (column) {
    case 'amount':
      return (
        <td data-dragging={drag} className="data-table__cell cell-amount">
          <Link href={`/payments/${payment.id}`} className="tabular-nums" onFocus={onFocusLink}>
            {formatMoney(payment.amount, payment.currency)}
          </Link>
        </td>
      );
    case 'currency':
      return (
        <td data-dragging={drag} className="data-table__cell cell-currency">
          {CURRENCY_LABEL[payment.currency]}
        </td>
      );
    case 'status':
      return (
        <td data-dragging={drag} className="data-table__cell cell-status">
          <StatusBadge status={payment.status} />
        </td>
      );
    case 'method':
      return (
        <td data-dragging={drag} className="data-table__cell">
          <PaymentMethodCell method={payment.paymentMethod} />
        </td>
      );
    case 'description':
      return (
        <td data-dragging={drag} className="data-table__cell">
          {payment.description}
        </td>
      );
    case 'customer':
      return (
        <td data-dragging={drag} className="data-table__cell" title={payment.customer.name ?? undefined}>
          {payment.customer.email}
        </td>
      );
    case 'date':
      return (
        <td data-dragging={drag} className="data-table__cell">
          <CreatedCell iso={payment.created} />
        </td>
      );
    case 'refunded':
      return (
        <td data-dragging={drag} className="data-table__cell">
          <OptionalDate iso={payment.refundedAt} />
        </td>
      );
    case 'decline':
      return (
        <td data-dragging={drag} className="data-table__cell" title={payment.declineReason ?? undefined}>
          {payment.declineReason ?? <EmptyValue />}
        </td>
      );
    case 'id':
      return (
        <td data-dragging={drag} className="data-table__cell">
          <CopyableId id={payment.id} />
        </td>
      );
  }
}

/** Loading placeholder: same columns and row height as the real table (no layout shift). */
export function PaymentsTableSkeleton({ rows = 10 }: { rows?: number }) {
  const widths = [52, 30, 74, 92, 120, 170, 104, 16, 16, 96];
  return (
    <table
      className="data-table"
      style={{
        minWidth: tableMinWidth(
          DEFAULT_COLUMN_LAYOUT,
          COLUMNS.map((column) => column.id),
        ),
      }}
      aria-busy="true"
      aria-label="Loading payments"
    >
      <TableColGroup columns={COLUMNS} widthOf={(id) => COLUMN_BY_ID[id].defaultWidth} />
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
          <th className="data-table__head-cell cell-filler" />
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
            <td className="data-table__cell cell-filler" />
            <td className="data-table__cell cell-actions" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
