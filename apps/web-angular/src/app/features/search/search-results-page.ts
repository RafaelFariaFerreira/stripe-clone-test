import { A11yModule } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  clearSearchFilters,
  countSearchFilters,
  CURRENCY_LABEL,
  formatMoney,
  getSearchSort,
  isUncollected,
  paginate,
  paymentsToCsv,
  searchAllPayments,
  SEARCH_PAGE_SIZE,
  SEARCH_SORT_OPTIONS,
  toggleSearchSort,
  withSearchSort,
  writeSearchFilterPanel,
  type Payment,
  type SearchFilterPanel,
  type SearchSort,
} from '@stripe-clone/domain';
import { PaymentsStore } from '../../core/payments-store';
import { StatusBadge } from '../../ui/badge';
import { eventValue } from '../../ui/dom';
import { Icon } from '../../ui/icon';
import { POPOVER_POSITIONS } from '../payments/filters/filter-pill';
import { CreatedCell, PaymentMethodCell } from '../payments/table/cells';
import { PaymentsTableSkeleton } from '../payments/table/payments-table';
import { FiltersPanel } from './filters-panel';

/**
 * Search results page (`/search?query=…`), modelled on the Dashboard's. The
 * query text is the whole state: the sort select and the Filters panel
 * rewrite it, so every view is a link. Route query params bind to inputs.
 */
@Component({
  selector: 'app-search-results-page',
  imports: [
    A11yModule,
    CdkConnectedOverlay,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkOverlayOrigin,
    CreatedCell,
    FiltersPanel,
    Icon,
    PaymentMethodCell,
    PaymentsTableSkeleton,
    RouterLink,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-page">
      <div class="search-page__header">
        <h1 class="search-page__title">{{ empty() ? 'Search results' : 'Search results: Payments' }}</h1>
        <div class="search-page__actions">
          <button
            #filterTrigger
            type="button"
            class="button button--secondary"
            cdkOverlayOrigin
            #origin="cdkOverlayOrigin"
            aria-haspopup="dialog"
            [attr.aria-expanded]="filtersOpen()"
            (click)="filtersOpen.set(!filtersOpen())"
          >
            <svg appIcon="filter" [size]="12"></svg>
            <span>Filter</span>
            @if (filterCount()) {
              <span class="filter-count">{{ filterCount() }}</span>
            }
          </button>
          <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOrigin]="origin"
            [cdkConnectedOverlayOpen]="filtersOpen()"
            [cdkConnectedOverlayPositions]="positions"
            (overlayOutsideClick)="onOutsideClick($event, filterTrigger)"
            (overlayKeydown)="$event.key === 'Escape' && filtersOpen.set(false)"
            (detach)="filtersOpen.set(false)"
          >
            <div class="popover popover--in-pane" role="dialog" aria-label="Filters" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
              <app-filters-panel [query]="query()" (applied)="applyFilters($event)" (cleared)="clearFilters()" />
            </div>
          </ng-template>

          <label class="sr-only" for="search-sort">Sort results</label>
          <select id="search-sort" name="sort" class="select select--button" (change)="changeSort($event)">
            @for (option of sortOptions; track option.id) {
              <option [value]="option.id" [selected]="option.id === sort()">{{ option.label }}</option>
            }
          </select>
          @if (!empty()) {
            <button type="button" class="button button--secondary" [disabled]="!matching().length" (click)="exportCsv()">
              <svg appIcon="export" [size]="12"></svg>
              <span>Export</span>
            </button>
          }
        </div>
      </div>

      @if (store.hasError()) {
        <div class="state-box" role="alert">
          <p class="state-box__title">We couldn't load your payments. Check your connection and try again.</p>
        </div>
      } @else if (!store.payments()) {
        <div class="table-scroll search-page__table"><app-payments-table-skeleton /></div>
      } @else if (empty()) {
        <div class="search-empty" role="status">
          <svg appIcon="search" [size]="16"></svg>
          <p class="search-empty__title">No search results found</p>
          <p class="search-empty__text">
            Please try again with a different query or
            <button type="button" class="link" (click)="clearFilters()">clear your filters</button>
          </p>
          <a class="link search-empty__support" target="_blank" rel="noreferrer" [href]="supportHref()">Search the support site</a>
        </div>
      } @else {
        <div class="table-scroll search-page__table" tabindex="0" role="region" aria-label="Search results">
          <table class="data-table data-table--search">
            <caption class="sr-only">
              Payment search results
            </caption>
            <colgroup>
              @for (column of columns; track column) {
                <col [class]="'col-search-' + column" />
              }
            </colgroup>
            <thead>
              <tr>
                <th scope="col" class="data-table__head-cell cell-select">
                  <input type="checkbox" class="checkbox" name="select-all-results" aria-label="Select all results" disabled />
                </th>
                <th scope="col" class="data-table__head-cell data-table__head-cell--right" [attr.aria-sort]="ariaSort('amount')">
                  <button type="button" class="sort-button" (click)="sortBy('amount')">
                    <span>Amount</span>
                    <span class="sort-button__indicator" aria-hidden="true"
                      ><svg [appIcon]="sortIcon('amount')" [size]="sortIconSize('amount')"></svg
                    ></span>
                  </button>
                </th>
                <th scope="col" class="data-table__head-cell"><span class="sr-only">Currency</span></th>
                <th scope="col" class="data-table__head-cell"><span class="sr-only">Status</span></th>
                <th scope="col" class="data-table__head-cell">Description</th>
                <th scope="col" class="data-table__head-cell">Customer</th>
                <th scope="col" class="data-table__head-cell">Payment method</th>
                <th scope="col" class="data-table__head-cell" [attr.aria-sort]="ariaSort('created')">
                  <button type="button" class="sort-button" (click)="sortBy('created')">
                    <span>Date</span>
                    <span class="sort-button__indicator" aria-hidden="true"
                      ><svg [appIcon]="sortIcon('created')" [size]="sortIconSize('created')"></svg
                    ></span>
                  </button>
                </th>
                <th scope="col" class="data-table__head-cell cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (payment of result().rows; track payment.id) {
                <tr class="data-table__row" (click)="openRow($event, payment.id)" (mouseenter)="store.prefetchDetails(payment.id)">
                  <td class="data-table__cell cell-select">
                    <input
                      type="checkbox"
                      class="checkbox"
                      name="selected-results"
                      [attr.aria-label]="'Select payment ' + payment.id"
                      disabled
                    />
                  </td>
                  <td class="data-table__cell cell-amount" [class.cell-amount--muted]="uncollected(payment)">
                    <a class="tabular-nums" [routerLink]="['/payments', payment.id]">{{ money(payment) }}</a>
                  </td>
                  <td class="data-table__cell cell-currency">{{ currencyLabel[payment.currency] }}</td>
                  <td class="data-table__cell cell-status"><app-status-badge [status]="payment.status" /></td>
                  <td class="data-table__cell">{{ payment.description }}</td>
                  <td class="data-table__cell">{{ payment.customer.email }}</td>
                  <td class="data-table__cell"><app-payment-method-cell [method]="payment.paymentMethod" [compact]="true" /></td>
                  <td class="data-table__cell"><app-created-cell [iso]="payment.created" /></td>
                  <td class="data-table__cell cell-actions">
                    <button
                      type="button"
                      class="icon-button icon-button--sm"
                      aria-label="More options"
                      [cdkMenuTriggerFor]="rowMenu"
                      [cdkMenuTriggerData]="{ $implicit: payment }"
                      (click)="$event.stopPropagation()"
                    >
                      <svg appIcon="more-horizontal" [size]="12"></svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <nav class="search-page__footer" aria-label="Pagination">
          <span aria-live="polite">{{ result().total }} {{ result().total === 1 ? 'item' : 'items' }}</span>
          <span class="search-page__pager">
            <button
              type="button"
              class="button button--secondary button--sm"
              [disabled]="result().page <= 1"
              (click)="goToPage(result().page - 1)"
            >
              Previous
            </button>
            <button
              type="button"
              class="button button--secondary button--sm"
              [disabled]="result().page >= result().pageCount"
              (click)="goToPage(result().page + 1)"
            >
              Next
            </button>
          </span>
        </nav>
      }
    </div>

    <ng-template #rowMenu let-payment>
      <div class="popover popover--in-pane menu" cdkMenu [attr.aria-label]="'More options for payment ' + payment.id">
        <div class="menu__label">Actions</div>
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="clipboard.copy(payment.id)">Copy payment ID</button>
        <div class="menu__divider" role="separator"></div>
        <div class="menu__label">Connections</div>
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="viewCustomer(payment)">View customer →</button>
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="openPayment(payment.id)">
          View payment details →
        </button>
      </div>
    </ng-template>
  `,
})
export class SearchResultsPage {
  /** `?query=` and `?page=`, bound by the router. */
  readonly queryParam = input<string | undefined>(undefined, { alias: 'query' });
  readonly page = input(1, { transform: (value: unknown) => Math.max(1, numberAttribute(value, 1)) });

  protected readonly store = inject(PaymentsStore);
  protected readonly clipboard = inject(Clipboard);
  private readonly router = inject(Router);

  protected readonly query = computed(() => this.queryParam() ?? '');
  protected readonly filtersOpen = signal(false);
  protected readonly positions = POPOVER_POSITIONS.slice().reverse();
  protected readonly sortOptions = SEARCH_SORT_OPTIONS;
  protected readonly currencyLabel = CURRENCY_LABEL;
  protected readonly columns = ['select', 'amount', 'currency', 'status', 'description', 'customer', 'method', 'date', 'actions'] as const;

  protected readonly matching = computed(() => {
    const payments = this.store.payments();
    return payments ? searchAllPayments(payments, this.query()) : [];
  });
  protected readonly result = computed(() => paginate(this.matching(), this.page(), SEARCH_PAGE_SIZE));
  protected readonly empty = computed(() => Boolean(this.store.payments()) && this.result().total === 0);
  protected readonly filterCount = computed(() => countSearchFilters(this.query()));
  protected readonly sort = computed(() => getSearchSort(this.query()));
  protected readonly supportHref = computed(() => `https://support.stripe.com/search?q=${encodeURIComponent(this.query())}`);

  private navigate(query: string, page = 1): void {
    void this.router.navigate(['/search'], { queryParams: { query: query.trim(), page: page > 1 ? page : null } });
  }

  protected applyFilters(panel: SearchFilterPanel): void {
    this.filtersOpen.set(false);
    this.navigate(writeSearchFilterPanel(this.query(), panel));
  }

  protected clearFilters(): void {
    this.filtersOpen.set(false);
    this.navigate(clearSearchFilters(this.query()));
  }

  protected changeSort(event: Event): void {
    const value = eventValue(event);
    const option = SEARCH_SORT_OPTIONS.find((item) => item.id === value);
    if (option) this.navigate(withSearchSort(this.query(), option.id));
  }

  protected sortBy(column: 'amount' | 'created'): void {
    this.navigate(toggleSearchSort(this.query(), column));
  }

  protected goToPage(page: number): void {
    this.navigate(this.query(), page);
  }

  protected ariaSort(column: 'amount' | 'created'): string | null {
    const sort: SearchSort = this.sort();
    if (sort === (column === 'amount' ? 'amount_desc' : 'newest')) return 'descending';
    if (sort === (column === 'amount' ? 'amount_asc' : 'oldest')) return 'ascending';
    return null;
  }

  protected sortIcon(column: 'amount' | 'created') {
    const state = this.ariaSort(column);
    return state === 'descending' ? 'arrow-down' : state === 'ascending' ? 'arrow-up' : 'chevron-updown';
  }

  protected sortIconSize(column: 'amount' | 'created'): 8 | 12 {
    return this.ariaSort(column) ? 8 : 12;
  }

  protected onOutsideClick(event: MouseEvent, trigger: HTMLElement): void {
    if (!trigger.contains(event.target as Node)) this.filtersOpen.set(false);
  }

  protected openRow(event: MouseEvent, id: string): void {
    if ((event.target as HTMLElement).closest('a, button, input, label')) return;
    this.openPayment(id);
  }

  protected openPayment(id: string): void {
    void this.router.navigate(['/payments', id]);
  }

  protected viewCustomer(payment: Payment): void {
    void this.router.navigate(['/payments'], { queryParams: { q: payment.customer.email } });
  }

  protected money(payment: Payment): string {
    return formatMoney(payment.amount, payment.currency);
  }

  protected uncollected(payment: Payment): boolean {
    return isUncollected(payment);
  }

  protected exportCsv(): void {
    const blob = new Blob([paymentsToCsv(this.matching())], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
