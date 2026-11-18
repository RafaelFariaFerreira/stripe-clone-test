import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { addDays, toIsoDay, type DateFilter, type DatePreset } from '@stripe-clone/domain';
import { eventValue } from '../../../ui/dom';
import { FilterPanel } from './filter-panel';

const PRESETS: ReadonlyArray<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'last_7_days', label: '7 days' },
  { id: 'last_30_days', label: '30 days' },
  { id: 'custom', label: 'Custom' },
];

/** Presets (Today, 7 days, 30 days) plus an inclusive custom day range. */
@Component({
  selector: 'app-date-filter-panel',
  imports: [FilterPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <app-filter-panel title="Date and time" [applyDisabled]="invalid()" (applied)="apply()">
      <div class="segmented" role="group" aria-label="Date range preset">
        @for (option of presets; track option.id) {
          <button type="button" class="segmented__option" [attr.aria-pressed]="preset() === option.id" (click)="preset.set(option.id)">
            {{ option.label }}
          </button>
        }
      </div>
      @if (preset() === 'custom') {
        <div class="filter-panel__row">
          <div>
            <label class="field-label" for="date-from">From</label>
            <input
              id="date-from"
              name="from"
              class="input"
              type="date"
              [max]="today"
              [value]="from()"
              (input)="from.set(eventValue($event))"
            />
          </div>
          <div>
            <label class="field-label" for="date-to">To</label>
            <input id="date-to" name="to" class="input" type="date" [max]="today" [value]="to()" (input)="to.set(eventValue($event))" />
          </div>
        </div>
      }
      @if (invalid()) {
        <p class="filter-panel__error">The start date must be before the end date.</p>
      }
    </app-filter-panel>
  `,
})
export class DateFilterPanel {
  readonly value = input<DateFilter | null>(null);
  readonly applied = output<DateFilter>();

  protected readonly eventValue = eventValue;

  protected readonly presets = PRESETS;
  protected readonly today = toIsoDay(new Date());
  protected readonly preset = linkedSignal<DatePreset>(() => this.value()?.preset ?? 'last_7_days');
  protected readonly from = linkedSignal(() => {
    const value = this.value();
    return value?.preset === 'custom' ? value.from : toIsoDay(addDays(new Date(), -6));
  });
  protected readonly to = linkedSignal(() => {
    const value = this.value();
    return value?.preset === 'custom' ? value.to : this.today;
  });
  protected readonly invalid = computed(() => this.preset() === 'custom' && (!this.from() || !this.to() || this.from() > this.to()));

  protected apply(): void {
    const preset = this.preset();
    this.applied.emit(preset === 'custom' ? { preset, from: this.from(), to: this.to() } : { preset });
  }
}
