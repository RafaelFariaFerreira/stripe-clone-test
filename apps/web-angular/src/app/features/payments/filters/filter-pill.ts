import { A11yModule } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, computed, contentChild, input, output, signal } from '@angular/core';
import { Icon } from '../../../ui/icon';

/** Context given to the projected panel template: `let-close`. */
export interface FilterPanelContext {
  $implicit: () => void;
}

export const POPOVER_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
];

/**
 * Dashboard filter pill. Empty: dashed outline with `⊕`. Applied: solid
 * outline, an `✕` to clear, and the value summary in brand color.
 *
 * The panel is an `<ng-template let-close>` child, so it is only instantiated
 * (and, with `@defer`, only downloaded) when the popover opens.
 */
@Component({
  selector: 'app-filter-pill',
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, Icon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span class="filter-pill" [attr.data-active]="active()">
      @if (active()) {
        <button type="button" class="filter-pill__clear" [attr.aria-label]="'Clear ' + label() + ' filter'" (click)="cleared.emit()">
          <svg appIcon="status-cross" [size]="12"></svg>
        </button>
      }
      <button
        #trigger
        type="button"
        class="filter-pill__trigger"
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        @if (!active()) {
          <svg appIcon="plus-circle" [size]="12"></svg>
        }
        <span>{{ label() }}</span>
        @if (active()) {
          <span class="filter-pill__divider" aria-hidden="true"></span>
          <span class="filter-pill__value">{{ summary() }}</span>
          <svg appIcon="chevron-down" [size]="8"></svg>
        }
      </button>
    </span>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayViewportMargin]="8"
      (overlayOutsideClick)="onOutsideClick($event, trigger)"
      (overlayKeydown)="onKeydown($event)"
      (detach)="close()"
    >
      <div
        class="popover popover--in-pane"
        role="dialog"
        [attr.aria-label]="label() + ' filter'"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <ng-container [ngTemplateOutlet]="panel()" [ngTemplateOutletContext]="{ $implicit: closeFn }" />
      </div>
    </ng-template>
  `,
})
export class FilterPill {
  readonly label = input.required<string>();
  /** Summary of the applied value; when present the pill renders in its active style. */
  readonly summary = input<string | null>(null);
  readonly cleared = output<void>();

  protected readonly panel = contentChild.required<TemplateRef<FilterPanelContext>>(TemplateRef);
  protected readonly open = signal(false);
  protected readonly active = computed(() => Boolean(this.summary()));
  protected readonly positions = POPOVER_POSITIONS;
  protected readonly closeFn = () => this.close();

  protected close(): void {
    this.open.set(false);
  }

  /** Clicking the trigger itself toggles; anything else outside closes. */
  protected onOutsideClick(event: MouseEvent, trigger: HTMLElement): void {
    if (!trigger.contains(event.target as Node)) this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}
