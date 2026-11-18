import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS_META, type BadgeTone, type PaymentStatus, type StatusIcon } from '@stripe-clone/domain';
import type { IconName } from '@stripe-clone/icons';
import { Icon } from './icon';

const STATUS_ICON: Readonly<Record<StatusIcon, IconName>> = {
  check: 'status-check',
  cross: 'status-cross',
  blocked: 'status-blocked',
  refund: 'status-refund',
  clock: 'status-clock',
  alert: 'status-alert',
};

/** Compact status pill: 20px tall, 1px border, label followed by an optional glyph. */
@Component({
  selector: 'app-badge',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge badge--{{ tone() }}" [class.badge--plain]="!icon()">
      <ng-content />
      @if (icon(); as name) {
        <svg [appIcon]="name" [size]="12"></svg>
      }
    </span>
  `,
  host: { style: 'display: contents' },
})
export class Badge {
  readonly tone = input.required<BadgeTone>();
  readonly icon = input<IconName>();
}

/** Badge for a payment status; colors, label and icon come from the domain catalog. */
@Component({
  selector: 'app-status-badge',
  imports: [Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-badge [tone]="meta().tone" [icon]="icon()">{{ meta().label }}</app-badge>`,
  host: { style: 'display: contents' },
})
export class StatusBadge {
  readonly status = input.required<PaymentStatus>();
  protected readonly meta = computed(() => STATUS_META[this.status()]);
  protected readonly icon = computed(() => STATUS_ICON[this.meta().icon]);
}
