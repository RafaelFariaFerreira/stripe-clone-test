import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { StatusBadge } from '../../../ui/badge';
import { CopyableId } from '../../../ui/copyable-id';
import { Icon } from '../../../ui/icon';
import { Indeterminate } from '../../../ui/indeterminate';
import { PaymentsStore } from '../../../core/payments-store';
import { CreatedCell, PaymentMethodCell } from './cells';
import { ColumnInteractions } from './column-interactions';
import { RowActions } from './row-actions';

export interface SortEvent {
  column: SortColumn;
  additive: boolean;
}

/**
 * The payments table. Real table semantics; each row navigates to the details
 * page on click, while the amount cell holds the keyboard-accessible link so
 * there are no nested interactive elements.
 *
 * Columns have explicit widths (`table-layout: fixed`) and a trailing filler
 * column takes any spare room, so resizing one column never changes the width
 * of its neighbours. See `ColumnInteractions` for resizing and reordering.
 */
@Component({
  selector: 'app-payments-table',
  imports: [CopyableId, CreatedCell, Icon, Indeterminate, PaymentMethodCell, RouterLink, RowActions, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <table
      class="data-table"
      [style.min-width.px]="interactions.minTableWidth()"
      [attr.data-show-resizers]="interactions.showResizers() || null"
      [attr.data-interacting]="interactions.drag() ? true : null"
      [attr.data-resizing]="interactions.draft() ? true : null"
    >
      <caption class="sr-only">
        Payments
      </caption>
      <colgroup>
        <col class="col-select" />
        @for (column of columns(); track column.id) {
          <col [style.width.px]="interactions.widthOf(column.id)" />
        }
        <col class="col-filler" />
        <col class="col-actions" />
      </colgroup>
      <thead (pointermove)="interactions.onHeadPointerMove()" (pointerleave)="interactions.onHeadPointerLeave()">
        <tr>
          <th scope="col" class="data-table__head-cell cell-select">
            <input
              type="checkbox"
              class="checkbox"
              name="select-all-payments"
              aria-label="Select all payments on this page"
              [checked]="allSelected()"
              [appIndeterminate]="someSelected() && !allSelected()"
              [disabled]="selectable().length === 0"
              (change)="toggleAll()"
            />
          </th>
          @for (column of columns(); track column.id) {
            <th
              scope="col"
              class="data-table__head-cell"
              [class.data-table__head-cell--right]="column.align === 'right'"
              [class.cell-currency]="column.id === 'currency'"
              [attr.aria-sort]="ariaSort(column)"
              [attr.data-column-id]="column.id"
              data-reorderable="true"
              [attr.data-dragging]="interactions.drag()?.id === column.id || null"
              (pointerdown)="interactions.startReorder($event, column.id, column.header || column.name)"
            >
              @if (column.sortKey; as sortKey) {
                <button
                  type="button"
                  class="sort-button"
                  [title]="'Sort by ' + column.name.toLowerCase() + ' (Shift+click to add a secondary sort, Alt+arrows to move the column)'"
                  (click)="interactions.consumeDragClick() || sorted.emit({ column: sortKey, additive: $event.shiftKey })"
                  (keydown)="interactions.onReorderKeyDown(column.id, $event)"
                  (keydown.shift.enter)="$event.preventDefault(); sorted.emit({ column: sortKey, additive: true })"
                >
                  @if (column.header) {
                    <span>{{ column.header }}</span>
                  } @else {
                    <span class="sr-only">{{ column.name }}</span>
                  }
                  @let state = sortState(sortKey);
                  <span class="sort-button__indicator" [class.sort-button__indicator--idle]="!state" aria-hidden="true">
                    <svg [appIcon]="state?.direction === 'asc' ? 'arrow-up' : 'arrow-down'" [size]="8"></svg>
                    @if (state && sort().length > 1) {
                      {{ state.priority }}
                    }
                  </span>
                  @if (state) {
                    <span class="sr-only">, sorted {{ state.direction === 'asc' ? 'ascending' : 'descending' }}</span>
                  }
                </button>
              } @else if (column.header) {
                {{ column.header }}
              } @else {
                <span class="sr-only">{{ column.name }}</span>
              }
              <span
                class="column-resizer"
                role="separator"
                tabindex="0"
                aria-orientation="vertical"
                [attr.aria-label]="'Resize ' + column.name + ' column'"
                [attr.aria-valuenow]="interactions.widthOf(column.id)"
                [attr.data-active]="interactions.draft()?.id === column.id || null"
                (pointerdown)="interactions.startResize($event, column.id)"
                (click)="$event.stopPropagation()"
                (dblclick)="$event.stopPropagation(); interactions.resetWidth(column.id)"
                (keydown)="interactions.onResizerKeyDown(column.id, $event)"
              ></span>
            </th>
          }
          <th scope="col" class="data-table__head-cell cell-filler" aria-hidden="true"></th>
          <th scope="col" class="data-table__head-cell cell-actions"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        @for (payment of rows(); track payment.id) {
          <tr
            class="data-table__row"
            [attr.aria-selected]="selected().has(payment.id) || null"
            (click)="openRow($event, payment.id)"
            (mouseenter)="warm(payment.id)"
          >
            <td class="data-table__cell cell-select">
              <input
                type="checkbox"
                class="checkbox"
                name="selected-payments"
                [value]="payment.id"
                [attr.aria-label]="'Select payment ' + payment.id"
                [checked]="selected().has(payment.id)"
                [disabled]="!canSelect(payment)"
                (change)="toggleRow(payment.id)"
              />
            </td>
            @for (column of columns(); track column.id) {
              @switch (column.id) {
                @case ('amount') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell cell-amount">
                    <a class="tabular-nums" [routerLink]="['/payments', payment.id]" (focus)="warm(payment.id)">{{ money(payment) }}</a>
                  </td>
                }
                @case ('currency') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell cell-currency">
                    {{ currencyLabel[payment.currency] }}
                  </td>
                }
                @case ('status') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell cell-status">
                    <app-status-badge [status]="payment.status" />
                  </td>
                }
                @case ('method') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell">
                    <app-payment-method-cell [method]="payment.paymentMethod" />
                  </td>
                }
                @case ('description') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell">
                    {{ payment.description }}
                  </td>
                }
                @case ('customer') {
                  <td
                    [attr.data-dragging]="interactions.drag()?.id === column.id || null"
                    class="data-table__cell"
                    [title]="payment.customer.name ?? ''"
                  >
                    {{ payment.customer.email }}
                  </td>
                }
                @case ('date') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell">
                    <app-created-cell [iso]="payment.created" />
                  </td>
                }
                @case ('refunded') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell">
                    @if (payment.refundedAt; as refundedAt) {
                      <app-created-cell [iso]="refundedAt" />
                    } @else {
                      <span class="cell-empty" aria-label="None">—</span>
                    }
                  </td>
                }
                @case ('decline') {
                  <td
                    [attr.data-dragging]="interactions.drag()?.id === column.id || null"
                    class="data-table__cell"
                    [title]="payment.declineReason ?? ''"
                  >
                    @if (payment.declineReason) {
                      {{ payment.declineReason }}
                    } @else {
                      <span class="cell-empty" aria-label="None">—</span>
                    }
                  </td>
                }
                @case ('id') {
                  <td [attr.data-dragging]="interactions.drag()?.id === column.id || null" class="data-table__cell">
                    <app-copyable-id [id]="payment.id" />
                  </td>
                }
              }
            }
            <td class="data-table__cell cell-filler"></td>
            <td class="data-table__cell cell-actions"><app-row-actions [payment]="payment" /></td>
          </tr>
        }
      </tbody>
    </table>
    @if (interactions.drag()?.indicatorX; as indicatorX) {
      <span class="column-drop-indicator" [style.left.px]="indicatorX" aria-hidden="true"></span>
    }
  `,
})
export class PaymentsTable {
  readonly rows = input.required<readonly Payment[]>();
  readonly visibleColumns = input.required<ReadonlySet<ColumnId>>();
  /** Column order and widths (resizable and reorderable from the header). */
  readonly layout = input<ColumnLayout>(DEFAULT_COLUMN_LAYOUT);
  readonly layoutChange = output<ColumnLayout>();
  readonly sort = input.required<readonly SortRule[]>();
  readonly selected = input.required<ReadonlySet<string>>();
  readonly sorted = output<SortEvent>();
  readonly selectedChange = output<Set<string>>();

  private readonly router = inject(Router);
  private readonly store = inject(PaymentsStore);

  protected readonly currencyLabel = CURRENCY_LABEL;
  private readonly order = computed(() => visibleColumnOrder(this.layout(), this.visibleColumns()));
  protected readonly columns = computed(() => this.order().map((id) => COLUMN_BY_ID[id]));
  protected readonly interactions = new ColumnInteractions(this.layout, this.order, (layout) => this.layoutChange.emit(layout));
  protected readonly selectable = computed(() => this.rows().filter((row) => SELECTABLE_STATUSES.has(row.status)));
  private readonly selectedOnPage = computed(() => this.selectable().filter((row) => this.selected().has(row.id)).length);
  protected readonly allSelected = computed(() => this.selectable().length > 0 && this.selectedOnPage() === this.selectable().length);
  protected readonly someSelected = computed(() => this.selectedOnPage() > 0);

  protected money(payment: Payment): string {
    return formatMoney(payment.amount, payment.currency);
  }

  protected canSelect(payment: Payment): boolean {
    return SELECTABLE_STATUSES.has(payment.status);
  }

  protected sortState(column: SortColumn) {
    return getSortState(this.sort(), column);
  }

  protected ariaSort(column: ColumnDefinition): string | null {
    if (!column.sortKey) return null;
    const state = getSortState(this.sort(), column.sortKey);
    return state?.priority === 1 ? (state.direction === 'asc' ? 'ascending' : 'descending') : null;
  }

  protected toggleAll(): void {
    const next = new Set(this.selected());
    const all = this.allSelected();
    for (const row of this.selectable()) {
      if (all) next.delete(row.id);
      else next.add(row.id);
    }
    this.selectedChange.emit(next);
  }

  protected toggleRow(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedChange.emit(next);
  }

  protected openRow(event: MouseEvent, id: string): void {
    // Let buttons, links and checkboxes inside the row do their own thing.
    if ((event.target as HTMLElement).closest('a, button, input, label')) return;
    if (window.getSelection()?.toString()) return;
    void this.router.navigate(['/payments', id]);
  }

  protected warm(id: string): void {
    this.store.prefetchDetails(id);
  }
}

/** Loading placeholder: same columns and row height as the real table (no layout shift). */
@Component({
  selector: 'app-payments-table-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <table class="data-table" [style.min-width.px]="minWidth" aria-busy="true" aria-label="Loading payments">
      <colgroup>
        <col class="col-select" />
        @for (column of columns; track column.id) {
          <col [style.width.px]="column.defaultWidth" />
        }
        <col class="col-filler" />
        <col class="col-actions" />
      </colgroup>
      <thead>
        <tr>
          <th class="data-table__head-cell cell-select">
            <input type="checkbox" class="checkbox" name="loading" disabled aria-hidden="true" tabindex="-1" />
          </th>
          @for (column of columns; track column.id) {
            <th class="data-table__head-cell" [class.data-table__head-cell--right]="column.align === 'right'">{{ column.header }}</th>
          }
          <th class="data-table__head-cell cell-filler"></th>
          <th class="data-table__head-cell cell-actions"></th>
        </tr>
      </thead>
      <tbody>
        @for (row of placeholderRows; track row) {
          <tr class="skeleton-row">
            <td class="data-table__cell cell-select"><span class="skeleton" style="width: 16px; height: 16px"></span></td>
            @for (column of columns; track column.id; let index = $index) {
              <td class="data-table__cell" [class.cell-amount]="column.align === 'right'">
                <span class="skeleton" [style.width.px]="widths[index] ?? 60"></span>
              </td>
            }
            <td class="data-table__cell cell-filler"></td>
            <td class="data-table__cell cell-actions"></td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PaymentsTableSkeleton {
  protected readonly columns = COLUMNS;
  protected readonly minWidth = tableMinWidth(
    DEFAULT_COLUMN_LAYOUT,
    COLUMNS.map((column) => column.id),
  );
  protected readonly placeholderRows = Array.from({ length: 10 }, (_, index) => index);
  protected readonly widths = [52, 30, 74, 92, 120, 170, 104, 16, 16, 96];
}
