import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import type { AmountFilter, AmountOperator } from '@stripe-clone/domain';
import { Icon } from '../../../ui/icon';
import { eventValue } from '../../../ui/dom';
import { FilterPanel } from './filter-panel';

const OPERATORS: ReadonlyArray<{ id: AmountOperator; label: string }> = [
  { id: 'eq', label: 'is equal to' },
  { id: 'between', label: 'is between' },
  { id: 'gt', label: 'is greater than' },
  { id: 'lt', label: 'is less than' },
];

const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Amount filter with the Dashboard's operators; values are in major units. */
@Component({
  selector: 'app-amount-filter-panel',
  imports: [FilterPanel, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <app-filter-panel title="Amount" [applyDisabled]="invalid()" (applied)="apply()">
      <label class="sr-only" for="amount-operator">Condition</label>
      <select id="amount-operator" name="operator" class="select" [value]="operator()" (change)="setOperator(eventValue($event))">
        @for (option of operators; track option.id) {
          <option [value]="option.id" [selected]="option.id === operator()">{{ option.label }}</option>
        }
      </select>
      <div class="input-group">
        <svg appIcon="arrow-right" [size]="12"></svg>
        <input
          class="input"
          name="amount"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          [placeholder]="operator() === 'between' ? 'Min' : '0.00'"
          [attr.aria-label]="operator() === 'between' ? 'Minimum amount' : 'Amount'"
          [value]="first()"
          (input)="first.set(eventValue($event))"
        />
        @if (operator() === 'between') {
          <input
            class="input"
            name="amount-max"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="Max"
            aria-label="Maximum amount"
            [value]="second()"
            (input)="second.set(eventValue($event))"
          />
        }
      </div>
      <p class="filter-panel__hint">Compared in each payment's own currency.</p>
    </app-filter-panel>
  `,
})
export class AmountFilterPanel {
  readonly value = input<AmountFilter | null>(null);
  readonly applied = output<AmountFilter>();

  protected readonly eventValue = eventValue;

  protected readonly operators = OPERATORS;
  protected readonly operator = linkedSignal<AmountOperator>(() => this.value()?.operator ?? 'between');
  protected readonly first = linkedSignal(() => (this.value() ? String(this.value()?.value) : ''));
  protected readonly second = linkedSignal(() => {
    const value = this.value();
    return value?.operator === 'between' ? String(value.valueTo) : '';
  });

  protected readonly invalid = computed(() => {
    const a = toNumber(this.first());
    const b = toNumber(this.second());
    return Number.isNaN(a) || a < 0 || (this.operator() === 'between' && (Number.isNaN(b) || b < 0));
  });

  protected setOperator(value: string): void {
    const match = OPERATORS.find((option) => option.id === value);
    if (match) this.operator.set(match.id);
  }

  protected apply(): void {
    const operator = this.operator();
    const a = toNumber(this.first());
    const b = toNumber(this.second());
    this.applied.emit(operator === 'between' ? { operator, value: Math.min(a, b), valueTo: Math.max(a, b) } : { operator, value: a });
  }
}
