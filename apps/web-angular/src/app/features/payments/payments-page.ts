import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { filterAndSort, paginate, toggleSort, type PaymentsQuery } from '@stripe-clone/domain';
import { injectPaymentsQuery } from '../../core/payments-query';
import { PaymentsStore } from '../../core/payments-store';
import { preference } from '../../core/preferences';
import { HorizontalOverflow } from '../../ui/horizontal-overflow';
import { DEFAULT_VISIBLE_COLUMNS, type ColumnId } from './columns';
import { FilterBar } from './filters/filter-bar';
import { Pagination } from './pagination';
import { AnnouncementBanner, PaymentsHeader } from './payments-header';
import { EmptyResults, LoadError } from './states';
import { StatusCards } from './status-cards';
import { TableActions } from './table-actions';
import { PaymentsTable, PaymentsTableSkeleton, type SortEvent } from './table/payments-table';

/**
 * Payments list route. All state lives in the URL (see `injectPaymentsQuery`);
 * the dataset is cached by `PaymentsStore` and filtered in memory with the
 * shared domain engine.
 */
@Component({
  selector: 'app-payments-page',
  imports: [
    AnnouncementBanner,
    EmptyResults,
    FilterBar,
    HorizontalOverflow,
    LoadError,
    Pagination,
    PaymentsHeader,
    PaymentsTable,
    PaymentsTableSkeleton,
    StatusCards,
    TableActions,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-payments-header />
    <app-announcement-banner />

    <app-status-cards [active]="query().view" (selected)="setQuery({ view: $event })" />

    <div class="filter-toolbar">
      <app-filter-bar [query]="query()" (patch)="setQuery($event)" (clearAll)="clearFilters()" />
      <app-table-actions [rows]="matching()" [visible]="visibleColumns()" (visibleChange)="columnPreference.set([...$event])" />
    </div>

    @if (store.hasError()) {
      <app-load-error (retry)="store.reload()" />
    } @else if (!store.payments()) {
      <div class="table-region">
        <div class="table-scroll"><app-payments-table-skeleton /></div>
      </div>
    } @else if (result().total === 0) {
      <app-empty-results (clearAll)="clearFilters()" />
    } @else {
      <div class="table-region">
        <div class="table-scroll" appHorizontalOverflow tabindex="0" role="region" aria-label="Payments table, scrolls horizontally">
          <app-payments-table
            [rows]="result().rows"
            [visibleColumns]="visibleColumns()"
            [sort]="query().sort"
            [selected]="selected()"
            (sorted)="onSort($event)"
            (selectedChange)="selected.set($event)"
          />
        </div>
      </div>
      <app-pagination
        [result]="result()"
        [pageSize]="query().pageSize"
        (pageChange)="setQuery({ page: $event })"
        (pageSizeChange)="setQuery({ pageSize: $event })"
      />
    }
  `,
})
export class PaymentsPage {
  protected readonly store = inject(PaymentsStore);
  private readonly url = injectPaymentsQuery();

  protected readonly query = this.url.query;
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly columnPreference = preference<ColumnId[]>('payments.table.visible-columns', [...DEFAULT_VISIBLE_COLUMNS]);
  protected readonly visibleColumns = computed(() => new Set(this.columnPreference()));

  protected readonly matching = computed(() => {
    const payments = this.store.payments();
    return payments ? filterAndSort(payments, this.query()) : [];
  });
  protected readonly result = computed(() => paginate(this.matching(), this.query().page, this.query().pageSize));

  constructor() {
    // A shared link may point past the last page; normalise the URL quietly.
    effect(() => {
      const result = this.result();
      if (this.store.payments() && result.page !== this.query().page) this.setQuery({ page: result.page });
    });
  }

  protected setQuery(patch: Partial<PaymentsQuery>): void {
    this.url.setQuery(patch);
  }

  protected clearFilters(): void {
    this.url.clearFilters();
  }

  protected onSort(event: SortEvent): void {
    this.setQuery({ sort: toggleSort(this.query().sort, event.column, event.additive), page: 1 });
  }
}
