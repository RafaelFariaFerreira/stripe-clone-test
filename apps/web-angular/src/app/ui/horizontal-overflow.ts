import { DestroyRef, Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * Sets `data-overflowing="true"` while a horizontally scrollable element has
 * hidden content on its right edge, so the sticky column shadow only shows
 * when there is something underneath it.
 */
@Directive({
  selector: '[appHorizontalOverflow]',
  host: { '[attr.data-overflowing]': 'overflowing()' },
})
export class HorizontalOverflow {
  protected readonly overflowing = signal(false);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const update = () => this.overflowing.set(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    afterNextRender(() => {
      update();
      const observer = new ResizeObserver(update);
      observer.observe(element);
      if (element.firstElementChild) observer.observe(element.firstElementChild);
      element.addEventListener('scroll', update, { passive: true });
      this.cleanup = () => {
        observer.disconnect();
        element.removeEventListener('scroll', update);
      };
    });
    inject(DestroyRef).onDestroy(() => this.cleanup());
  }

  private cleanup: () => void = () => undefined;
}
