import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Shared popover layout: title, projected body and a full-width primary "Apply". */
@Component({
  selector: 'app-filter-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <form class="filter-panel" (submit)="submit($event)">
      <div class="filter-panel__header">
        <span class="filter-panel__title">Filter by {{ title().toLowerCase() }}</span>
      </div>
      <div class="filter-panel__body"><ng-content /></div>
      <div class="filter-panel__footer">
        <button type="submit" class="button button--primary button--block" [disabled]="applyDisabled()">Apply</button>
      </div>
    </form>
  `,
})
export class FilterPanel {
  readonly title = input.required<string>();
  readonly applyDisabled = input(false);
  readonly applied = output<void>();

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.applyDisabled()) this.applied.emit();
  }
}
