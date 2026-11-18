import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import {
  PAYMENT_TYPE_FLAGS,
  readSearchFilterPanel,
  SEARCH_AMOUNT_OPERATORS,
  SEARCH_DATE_OPERATORS,
  type PaymentTypeFlag,
  type SearchAmountOperator,
  type SearchDateOperator,
  type SearchDateUnit,
  type SearchFilterPanel,
} from '@stripe-clone/domain';
import { eventValue } from '../../ui/dom';
import { Icon } from '../../ui/icon';

const FLAG_LABEL: Readonly<Record<PaymentTypeFlag, string>> = {
  captured: 'Captured',
  disputed: 'Disputed',
  paid: 'Paid',
  refunded: 'Refunded',
};

/**
 * The Dashboard's search "Filters" popover: Type (object + payment flags),
 * Date and Amount. Done writes the panel back into the query text.
 */
@Component({
  selector: 'app-filters-panel',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @let state = panel();
    <div class="filters-panel">
      <div class="filters-panel__header">
        <button type="button" class="button button--secondary button--sm" (click)="cleared.emit()">Clear</button>
        <span class="filters-panel__title">Filters</span>
        <button type="button" class="button button--primary button--sm" (click)="applied.emit(state)">Done</button>
      </div>

      <div class="filters-panel__section">
        <label class="filters-panel__toggle">
          <input type="checkbox" class="checkbox" [checked]="state.type.enabled" (change)="patch('type', { enabled: checked($event) })" />
          Type
        </label>
        @if (state.type.enabled) {
          <div class="filters-panel__body">
            <select class="select" aria-label="Object type">
              <option value="payment">Payment</option>
            </select>
            <div class="filters-panel__flags">
              @for (flag of flags; track flag) {
                <label class="filters-panel__flag">
                  <input type="checkbox" class="checkbox" [checked]="state.type.flags.includes(flag)" (change)="toggleFlag(flag)" />
                  {{ flagLabel[flag] }}
                </label>
              }
            </div>
          </div>
        }
      </div>

      <div class="filters-panel__section">
        <label class="filters-panel__toggle">
          <input type="checkbox" class="checkbox" [checked]="state.date.enabled" (change)="patch('date', { enabled: checked($event) })" />
          Date
        </label>
        @if (state.date.enabled) {
          <div class="filters-panel__body">
            <select class="select" aria-label="Comparison type" (change)="patch('date', { operator: dateOperator($event) })">
              @for (operator of dateOperators; track operator.id) {
                <option [value]="operator.id" [selected]="operator.id === state.date.operator">{{ operator.label }}</option>
              }
            </select>
            <div class="filters-panel__row">
              <svg appIcon="arrow-right" [size]="12"></svg>
              @switch (state.date.operator) {
                @case ('last') {
                  <input
                    class="input"
                    type="number"
                    min="1"
                    aria-label="Filter value"
                    [value]="state.date.amount || ''"
                    (input)="patch('date', { amount: numberValue($event) })"
                  />
                  <select class="select" aria-label="Unit select" (change)="patch('date', { unit: dateUnit($event) })">
                    @for (unit of units; track unit) {
                      <option [value]="unit" [selected]="unit === state.date.unit">{{ unit }}</option>
                    }
                  </select>
                }
                @case ('before') {
                  <input
                    class="input"
                    type="date"
                    aria-label="Date"
                    [value]="state.date.to"
                    (input)="patch('date', { to: eventValue($event) })"
                  />
                }
                @default {
                  <input
                    class="input"
                    type="date"
                    [attr.aria-label]="state.date.operator === 'between' ? 'Start date' : 'Date'"
                    [value]="state.date.from"
                    (input)="patch('date', { from: eventValue($event) })"
                  />
                }
              }
            </div>
            @if (state.date.operator === 'between') {
              <div class="filters-panel__row">
                <svg appIcon="arrow-right" [size]="12"></svg>
                <input
                  class="input"
                  type="date"
                  aria-label="End date"
                  [value]="state.date.to"
                  (input)="patch('date', { to: eventValue($event) })"
                />
              </div>
            }
          </div>
        }
      </div>

      <div class="filters-panel__section">
        <label class="filters-panel__toggle">
          <input
            type="checkbox"
            class="checkbox"
            [checked]="state.amount.enabled"
            (change)="patch('amount', { enabled: checked($event) })"
          />
          Amount
        </label>
        @if (state.amount.enabled) {
          <div class="filters-panel__body">
            <select class="select" aria-label="Amount comparison" (change)="patch('amount', { operator: amountOperator($event) })">
              @for (operator of amountOperators; track operator.id) {
                <option [value]="operator.id" [selected]="operator.id === state.amount.operator">{{ operator.label }}</option>
              }
            </select>
            <div class="filters-panel__row">
              <svg appIcon="arrow-right" [size]="12"></svg>
              <input
                class="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                [attr.aria-label]="state.amount.operator === 'between' ? 'Minimum amount' : 'Amount'"
                [value]="state.amount.value"
                (input)="patch('amount', { value: eventValue($event) })"
              />
              @if (state.amount.operator === 'between') {
                <input
                  class="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  aria-label="Maximum amount"
                  [value]="state.amount.valueTo"
                  (input)="patch('amount', { valueTo: eventValue($event) })"
                />
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class FiltersPanel {
  readonly query = input.required<string>();
  readonly applied = output<SearchFilterPanel>();
  readonly cleared = output<void>();

  protected readonly panel = linkedSignal(() => readSearchFilterPanel(this.query()));
  protected readonly flags = PAYMENT_TYPE_FLAGS;
  protected readonly flagLabel = FLAG_LABEL;
  protected readonly dateOperators = SEARCH_DATE_OPERATORS;
  protected readonly amountOperators = SEARCH_AMOUNT_OPERATORS;
  protected readonly units: readonly SearchDateUnit[] = ['hours', 'days', 'months'];
  protected readonly eventValue = eventValue;

  protected patch<K extends keyof SearchFilterPanel>(key: K, value: Partial<SearchFilterPanel[K]>): void {
    this.panel.update((current) => ({ ...current, [key]: { ...current[key], ...value } }));
  }

  protected toggleFlag(flag: PaymentTypeFlag): void {
    const flags = this.panel().type.flags;
    this.patch('type', { flags: flags.includes(flag) ? flags.filter((item) => item !== flag) : [...flags, flag] });
  }

  protected checked(event: Event): boolean {
    return event.target instanceof HTMLInputElement && event.target.checked;
  }

  protected numberValue(event: Event): number {
    return Number(eventValue(event));
  }

  protected dateOperator(event: Event): SearchDateOperator {
    const value = eventValue(event);
    return SEARCH_DATE_OPERATORS.find((operator) => operator.id === value)?.id ?? 'last';
  }

  protected amountOperator(event: Event): SearchAmountOperator {
    const value = eventValue(event);
    return SEARCH_AMOUNT_OPERATORS.find((operator) => operator.id === value)?.id ?? 'eq';
  }

  protected dateUnit(event: Event): SearchDateUnit {
    const value = eventValue(event);
    return this.units.find((unit) => unit === value) ?? 'days';
  }
}
