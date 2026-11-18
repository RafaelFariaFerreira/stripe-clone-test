import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  CURRENCIES,
  CURRENCY_LABEL,
  hasActiveFilters,
  PAYMENT_METHOD_TYPE_LABEL,
  PAYMENT_METHOD_TYPES,
  STATUS_FILTER_OPTIONS,
  STATUS_META,
  summarizeAmountFilter,
  summarizeCurrencies,
  summarizeDateFilter,
  summarizeMethods,
  summarizeStatuses,
  type AmountFilter,
  type CurrencyCode,
  type DateFilter,
  type PaymentMethodType,
  type PaymentsQuery,
  type PaymentStatus,
} from '@stripe-clone/domain';
import { Icon } from '../../../ui/icon';
import { Spinner } from '../../../ui/feedback';
import { AmountFilterPanel } from './amount-filter-panel';
import { ChecklistFilterPanel } from './checklist-filter-panel';
import { DateFilterPanel } from './date-filter-panel';
import { FilterPill } from './filter-pill';

/**
 * Row of filter pills, in the reference order. Panel bodies sit in `@defer`
 * blocks, so their code is downloaded the first time a pill is opened.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [AmountFilterPanel, CdkMenu, CdkMenuItem, CdkMenuTrigger, ChecklistFilterPanel, DateFilterPanel, FilterPill, Icon, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="filter-bar" role="group" aria-label="Filters">
      <app-filter-pill label="Date and time" [summary]="dateSummary()" (cleared)="patch.emit({ date: null })">
        <ng-template let-close>
          @defer {
            <app-date-filter-panel [value]="query().date" (applied)="applyDate($event); close()" />
          } @placeholder {
            <div class="filter-panel detail-section__loading"><app-spinner label="Loading filter" /></div>
          }
        </ng-template>
      </app-filter-pill>

      <app-filter-pill label="Amount" [summary]="amountSummary()" (cleared)="patch.emit({ amount: null })">
        <ng-template let-close>
          @defer {
            <app-amount-filter-panel [value]="query().amount" (applied)="applyAmount($event); close()" />
          } @placeholder {
            <div class="filter-panel detail-section__loading"><app-spinner label="Loading filter" /></div>
          }
        </ng-template>
      </app-filter-pill>

      <app-filter-pill label="Currency" [summary]="currencySummary()" (cleared)="patch.emit({ currencies: [] })">
        <ng-template let-close>
          @defer {
            <app-checklist-filter-panel
              title="Currency"
              [options]="currencyOptions"
              [value]="query().currencies"
              (applied)="applyCurrencies($event); close()"
            />
          } @placeholder {
            <div class="filter-panel detail-section__loading"><app-spinner label="Loading filter" /></div>
          }
        </ng-template>
      </app-filter-pill>

      <app-filter-pill label="Status" [summary]="statusSummary()" (cleared)="patch.emit({ statuses: [] })">
        <ng-template let-close>
          @defer {
            <app-checklist-filter-panel
              title="Status"
              [options]="statusOptions"
              [value]="query().statuses"
              (applied)="applyStatuses($event); close()"
            />
          } @placeholder {
            <div class="filter-panel detail-section__loading"><app-spinner label="Loading filter" /></div>
          }
        </ng-template>
      </app-filter-pill>

      <app-filter-pill label="Payment method" [summary]="methodSummary()" (cleared)="patch.emit({ methods: [] })">
        <ng-template let-close>
          @defer {
            <app-checklist-filter-panel
              title="Payment method"
              [options]="methodOptions"
              [value]="query().methods"
              (applied)="applyMethods($event); close()"
            />
          } @placeholder {
            <div class="filter-panel detail-section__loading"><app-spinner label="Loading filter" /></div>
          }
        </ng-template>
      </app-filter-pill>

      <span class="filter-pill">
        <button type="button" class="filter-pill__trigger" [cdkMenuTriggerFor]="moreFilters">
          <svg appIcon="plus-circle" [size]="12"></svg>
          <span>More filters</span>
        </button>
      </span>
      <ng-template #moreFilters>
        <div class="popover popover--in-pane menu" cdkMenu aria-label="More filters">
          <div class="menu__label">Search the table by</div>
          <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="focusSearch()">Payment ID</button>
          <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="focusSearch()">Customer email</button>
          <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="focusSearch()">Card last 4 digits</button>
        </div>
      </ng-template>

      @if (showClear()) {
        <button type="button" class="clear-filters" (click)="clearAll.emit()">Clear filters</button>
      }
    </div>
  `,
})
export class FilterBar {
  readonly query = input.required<PaymentsQuery>();
  readonly patch = output<Partial<PaymentsQuery>>();
  readonly clearAll = output<void>();

  protected readonly statusOptions = STATUS_FILTER_OPTIONS.map((status) => ({ value: status, label: STATUS_META[status].label }));
  protected readonly methodOptions = PAYMENT_METHOD_TYPES.map((method) => ({ value: method, label: PAYMENT_METHOD_TYPE_LABEL[method] }));
  protected readonly currencyOptions = CURRENCIES.map((currency) => ({ value: currency, label: CURRENCY_LABEL[currency] }));

  protected readonly dateSummary = computed(() => {
    const date = this.query().date;
    return date ? summarizeDateFilter(date) : null;
  });
  protected readonly amountSummary = computed(() => {
    const amount = this.query().amount;
    return amount ? summarizeAmountFilter(amount) : null;
  });
  protected readonly currencySummary = computed(() =>
    this.query().currencies.length ? summarizeCurrencies(this.query().currencies) : null,
  );
  protected readonly statusSummary = computed(() => (this.query().statuses.length ? summarizeStatuses(this.query().statuses) : null));
  protected readonly methodSummary = computed(() => (this.query().methods.length ? summarizeMethods(this.query().methods) : null));
  protected readonly showClear = computed(() => hasActiveFilters(this.query()) || Boolean(this.query().search));

  protected applyDate(date: DateFilter): void {
    this.patch.emit({ date });
  }
  protected applyAmount(amount: AmountFilter): void {
    this.patch.emit({ amount });
  }
  protected applyCurrencies(values: string[]): void {
    this.patch.emit({ currencies: values as CurrencyCode[] });
  }
  protected applyStatuses(values: string[]): void {
    this.patch.emit({ statuses: values as PaymentStatus[] });
  }
  protected applyMethods(values: string[]): void {
    this.patch.emit({ methods: values as PaymentMethodType[] });
  }

  protected focusSearch(): void {
    document.getElementById('global-search')?.focus();
  }
}
