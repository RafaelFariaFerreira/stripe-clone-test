import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { shortenId } from '@stripe-clone/domain';
import { Icon } from './icon';
import { Tooltip } from './tooltip';

/** Monospace id chip with copy-to-clipboard and "Copied!" feedback. */
@Component({
  selector: 'app-copyable-id',
  imports: [Icon, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button
      type="button"
      class="copyable-id"
      [class.copyable-id--plain]="variant() === 'plain'"
      [appTooltip]="copied() ? 'Copied!' : 'Copy to clipboard'"
      [appTooltipDelay]="150"
      [attr.aria-label]="'Copy ' + id()"
      (click)="copy($event)"
    >
      <span>{{ text() }}</span>
      <svg appIcon="copy" [size]="12"></svg>
      <span class="sr-only" aria-live="polite">{{ copied() ? 'Copied' : '' }}</span>
    </button>
  `,
})
export class CopyableId {
  readonly id = input.required<string>();
  /** `short` truncates the middle (`pi_3UdA…9wsQ`); the full id is always copied. */
  readonly display = input<'short' | 'full'>('short');
  readonly variant = input<'chip' | 'plain'>('chip');

  protected readonly copied = signal(false);
  protected readonly text = computed(() => (this.display() === 'short' ? shortenId(this.id()) : this.id()));

  private readonly clipboard = inject(Clipboard);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected copy(event: Event): void {
    event.stopPropagation();
    this.clipboard.copy(this.id());
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), 1500);
  }
}
