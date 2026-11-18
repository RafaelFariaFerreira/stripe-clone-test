import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Icon } from '../ui/icon';

const DEBOUNCE_MS = 200;

/**
 * Top-bar search. On the Payments page it filters the table by payment ID,
 * customer email or last 4 digits (URL param `q`); elsewhere, Enter opens the
 * Payments page with the term applied. Press `/` anywhere to focus it.
 */
@Component({
  selector: 'app-global-search',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    <form role="search" class="global-search" (submit)="submit($event)">
      <svg appIcon="search" [size]="12"></svg>
      <label for="global-search" class="sr-only">Search payments by ID, email or last 4 digits</label>
      <input
        #input
        id="global-search"
        name="q"
        type="search"
        class="global-search__input"
        placeholder="Search"
        autocomplete="off"
        spellcheck="false"
        [value]="value()"
        (input)="onInput(input.value)"
        (keydown.escape)="clear()"
      />
      @if (value()) {
        <button
          type="button"
          class="icon-button icon-button--sm global-search__clear"
          aria-label="Clear search"
          (click)="clear(); input.focus()"
        >
          <svg appIcon="close" [size]="12"></svg>
        </button>
      }
    </form>
  `,
})
export class GlobalSearch {
  private readonly router = inject(Router);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  protected readonly value = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Adopt URL changes made elsewhere (Clear all, back button) without
    // clobbering in-progress typing such as a trailing space.
    const sync = () => {
      const fromUrl = this.onPayments() ? (this.router.parseUrl(this.router.url).queryParamMap.get('q') ?? '') : '';
      if (fromUrl !== this.value().trim()) this.value.set(fromUrl);
    };
    const subscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(sync);
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      clearTimeout(this.timer);
    });
  }

  protected onInput(next: string): void {
    this.value.set(next);
    clearTimeout(this.timer);
    if (this.onPayments()) this.timer = setTimeout(() => this.apply(next, true), DEBOUNCE_MS);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    clearTimeout(this.timer);
    this.apply(this.value(), this.onPayments());
  }

  protected clear(): void {
    this.onInput('');
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.input().nativeElement.focus();
    }
  }

  private onPayments(): boolean {
    return this.router.url.split('?')[0] === '/payments';
  }

  private apply(term: string, replaceUrl: boolean): void {
    const current = this.onPayments() ? this.router.parseUrl(this.router.url).queryParams : {};
    const queryParams: Record<string, string> = { ...current };
    if (term.trim()) queryParams['q'] = term.trim();
    else delete queryParams['q'];
    delete queryParams['page'];
    void this.router.navigate(['/payments'], { queryParams, replaceUrl });
  }
}
