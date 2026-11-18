import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  effect,
  inject,
  input,
  signal,
  type ComponentRef,
} from '@angular/core';
import {
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

let nextId = 0;

/** The dark bubble rendered inside the overlay pane. */
@Component({
  selector: 'app-tooltip-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tooltip tooltip--in-pane" role="tooltip" [id]="id()">{{ text() }}</div>`,
})
export class TooltipBubble {
  readonly text = signal('');
  readonly id = signal('');
}

/**
 * Tooltip shown on hover **and** keyboard focus, positioned with the CDK
 * overlay and linked to its trigger with `aria-describedby`:
 * `<button appTooltip="Copy to clipboard">`.
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'scheduleShow()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    '[attr.aria-describedby]': 'visible() ? id : null',
  },
})
export class Tooltip {
  readonly text = input.required<string>({ alias: 'appTooltip' });
  /** Delay before showing on hover, in ms. Hiding is immediate. */
  readonly delay = input(300, { alias: 'appTooltipDelay' });
  /** Optional callback invoked right before showing, e.g. to refresh relative times. */
  readonly beforeShow = input<() => void>(() => undefined, { alias: 'appTooltipBeforeShow' });

  protected readonly id = `tooltip-${nextId++}`;
  protected readonly visible = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private overlayRef?: OverlayRef;
  private bubble?: ComponentRef<TooltipBubble>;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Keep the bubble text live (e.g. "Copy to clipboard" → "Copied!").
    // Read the input first: with optional chaining it would not be tracked while no bubble exists.
    effect(() => {
      const text = this.text();
      this.bubble?.instance.text.set(text);
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.overlayRef?.dispose();
    });
  }

  protected scheduleShow(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(), this.delay());
  }

  protected show(): void {
    clearTimeout(this.timer);
    if (this.visible()) return;
    this.beforeShow()();
    this.overlayRef ??= createOverlayRef(this.injector, {
      positionStrategy: createFlexibleConnectedPositionStrategy(this.injector, this.host)
        .withPositions([
          { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
        ])
        .withViewportMargin(8),
      scrollStrategy: createRepositionScrollStrategy(this.injector),
    });
    this.bubble = this.overlayRef.attach(new ComponentPortal(TooltipBubble));
    this.bubble.instance.text.set(this.text());
    this.bubble.instance.id.set(this.id);
    this.overlayRef.addPanelClass('tooltip-pane');
    this.visible.set(true);
  }

  protected hide(): void {
    clearTimeout(this.timer);
    if (!this.visible()) return;
    this.overlayRef?.detach();
    this.bubble = undefined;
    this.visible.set(false);
  }
}
