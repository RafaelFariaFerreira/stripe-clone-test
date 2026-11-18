import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/** Filters matched nothing. Copy is verbatim from the Dashboard. */
@Component({
  selector: 'app-empty-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="state-box" role="status">
      <div>
        <p class="state-box__title">No results</p>
        <p class="state-box__description">No results match your criteria</p>
      </div>
      <button type="button" class="button button--secondary" (click)="clearAll.emit()">Clear all</button>
    </div>
  `,
})
export class EmptyResults {
  readonly clearAll = output<void>();
}

/** The dataset failed to load. */
@Component({
  selector: 'app-load-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="state-box" role="alert">
      <div>
        <p class="state-box__title">Something went wrong</p>
        <p class="state-box__description">We couldn't load your payments. Check your connection and try again.</p>
      </div>
      <button type="button" class="button button--secondary" (click)="retry.emit()">Retry</button>
    </div>
  `,
})
export class LoadError {
  readonly retry = output<void>();
}
