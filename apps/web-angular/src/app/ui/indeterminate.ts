import { Directive, ElementRef, effect, inject, input } from '@angular/core';

/** Reflects the `indeterminate` state onto a native checkbox (it has no attribute). */
@Directive({ selector: 'input[type=checkbox][appIndeterminate]' })
export class Indeterminate {
  readonly indeterminate = input(false, { alias: 'appIndeterminate' });
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  constructor() {
    effect(() => {
      this.element.nativeElement.indeterminate = this.indeterminate();
    });
  }
}
