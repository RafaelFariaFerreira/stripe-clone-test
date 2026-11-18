import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Thin ring spinner used while a section is loading. */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="spinner" role="status" [attr.aria-label]="label()"></span>`,
  host: { style: 'display: contents' },
})
export class Spinner {
  readonly label = input('Loading');
}

/** Shimmering placeholder block that reserves the final content size. */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="skeleton" aria-hidden="true" [style.width.px]="width()" [style.height.px]="height()"></span>`,
  host: { style: 'display: contents' },
})
export class Skeleton {
  readonly width = input.required<number>();
  readonly height = input(12);
}
