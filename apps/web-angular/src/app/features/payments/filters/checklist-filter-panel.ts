import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { FilterPanel } from './filter-panel';

export interface ChecklistOption {
  value: string;
  label: string;
}

/**
 * Multi-select filter (Status, Payment method, Currency). Applying with nothing
 * checked clears the filter.
 */
@Component({
  selector: 'app-checklist-filter-panel',
  imports: [FilterPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <app-filter-panel [title]="title()" (applied)="apply()">
      <fieldset class="filter-panel__options" style="border: 0; min-inline-size: 0">
        <legend class="sr-only">{{ title() }}</legend>
        @for (option of options(); track option.value) {
          <label class="check-option">
            <input
              type="checkbox"
              class="checkbox"
              [name]="title()"
              [value]="option.value"
              [checked]="draft().has(option.value)"
              (change)="toggle(option.value)"
            />
            <span class="check-option__label">{{ option.label }}</span>
          </label>
        }
      </fieldset>
    </app-filter-panel>
  `,
})
export class ChecklistFilterPanel {
  readonly title = input.required<string>();
  readonly options = input.required<readonly ChecklistOption[]>();
  readonly value = input<readonly string[]>([]);
  readonly applied = output<string[]>();

  protected readonly draft = linkedSignal<ReadonlySet<string>>(() => new Set(this.value()));

  protected toggle(option: string): void {
    const next = new Set(this.draft());
    if (next.has(option)) next.delete(option);
    else next.add(option);
    this.draft.set(next);
  }

  protected apply(): void {
    this.applied.emit(
      this.options()
        .map((option) => option.value)
        .filter((option) => this.draft().has(option)),
    );
  }
}
