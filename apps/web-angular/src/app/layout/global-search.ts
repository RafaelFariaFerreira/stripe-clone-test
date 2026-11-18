import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  applySearchSuggestion,
  buildSearchDropdown,
  formatMoney,
  formatShortDay,
  STATUS_META,
  type SearchOption,
  type StatusIcon,
} from '@stripe-clone/domain';
import type { IconName } from '@stripe-clone/icons';
import { filter } from 'rxjs';
import { PaymentsStore } from '../core/payments-store';
import { Badge } from '../ui/badge';
import { Icon } from '../ui/icon';

const STATUS_ICON: Readonly<Record<StatusIcon, IconName>> = {
  check: 'status-check',
  cross: 'status-cross',
  blocked: 'status-blocked',
  refund: 'status-refund',
  clock: 'status-clock',
  alert: 'status-alert',
};

/**
 * Top-bar search, modelled on the Dashboard's (see the React twin for the
 * behavior). The dropdown content comes from `buildSearchDropdown` in the
 * shared domain package; this component only renders it and maps actions.
 */
@Component({
  selector: 'app-global-search',
  imports: [Badge, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    <form role="search" class="global-search" (submit)="$event.preventDefault(); applyToTable(value())">
      <svg appIcon="search" [size]="12"></svg>
      <label for="global-search" class="sr-only">Search payments</label>
      <input
        #input
        id="global-search"
        name="q"
        type="search"
        class="global-search__input"
        placeholder="Search"
        autocomplete="off"
        spellcheck="false"
        role="combobox"
        aria-controls="global-search-listbox"
        aria-autocomplete="list"
        [attr.aria-expanded]="open()"
        [attr.aria-activedescendant]="open() && activeOption() ? activeOption()!.id : null"
        [value]="value()"
        (input)="update(input.value)"
        (focus)="open.set(true)"
        (blur)="open.set(false)"
        (keydown)="onKeydown($event)"
      />
      @if (value()) {
        <button
          type="button"
          class="icon-button icon-button--sm global-search__clear"
          aria-label="Clear search"
          (mousedown)="$event.preventDefault()"
          (click)="clear(); input.focus()"
        >
          <svg appIcon="close" [size]="12"></svg>
        </button>
      }

      @if (open()) {
        <!-- Keep focus in the input while clicking inside the dropdown. -->
        <div
          id="global-search-listbox"
          role="listbox"
          aria-label="Search suggestions"
          class="search-popover"
          (mousedown)="$event.preventDefault()"
        >
          <div class="search-popover__list">
            @for (section of dropdown().sections; track $index) {
              <div role="group" [attr.aria-label]="section.heading">
                @if (section.heading) {
                  <div class="search-popover__heading" role="presentation">{{ section.heading }}</div>
                }
                @for (option of section.options; track option.id) {
                  <div
                    role="option"
                    class="search-option"
                    [id]="option.id"
                    [attr.aria-selected]="activeOption()?.id === option.id"
                    (mousemove)="hover(option)"
                    (click)="select(option)"
                  >
                    <div class="search-option__card">
                      @switch (option.kind) {
                        @case ('filter') {
                          <span class="search-option__key">{{ option.filter.key }}:</span>
                          <span class="search-option__example">{{ option.filter.example }}</span>
                          <span class="search-option__description">{{ option.filter.description }}</span>
                        }
                        @case ('value') {
                          <span class="search-option__key">{{ option.suggestion.key }}:</span>
                          <span class="search-option__example">{{ option.suggestion.token }}</span>
                        }
                        @case ('apply') {
                          <svg appIcon="banknote" [size]="16"></svg>
                          <span class="search-option__query"
                            >Show only payment results for <strong>{{ option.query }}</strong></span
                          >
                        }
                        @case ('payment') {
                          <span class="search-result">
                            <app-badge [tone]="meta(option.payment.status).tone" [icon]="statusIcon(option.payment.status)">
                              <span class="sr-only">{{ meta(option.payment.status).label }}</span>
                            </app-badge>
                            <span class="search-result__amount tabular-nums">{{
                              money(option.payment.amount, option.payment.currency)
                            }}</span>
                            <span class="search-result__description">{{ option.payment.description }}</span>
                            <span class="search-result__date">{{ shortDay(option.payment.created) }}</span>
                          </span>
                        }
                      }
                    </div>
                  </div>
                } @empty {
                  @if (section.emptyText) {
                    <p class="search-popover__empty">{{ section.emptyText }}</p>
                  }
                }
                @if (section.divider) {
                  <div class="search-popover__divider" role="separator"></div>
                }
              </div>
            }
          </div>
          @let footer = dropdown().footer;
          <div class="search-popover__footer">
            <button
              type="button"
              role="option"
              tabindex="-1"
              class="search-popover__footer-button"
              [id]="footer.id"
              [attr.aria-selected]="activeOption()?.id === footer.id"
              (click)="select(footer)"
            >
              @if (footer.kind === 'toggle-filters') {
                {{ footer.expanded ? 'View fewer filters' : 'View more filters' }}
              } @else {
                View all results
              }
            </button>
          </div>
        </div>
      }
    </form>
  `,
})
export class GlobalSearch {
  private readonly router = inject(Router);
  private readonly store = inject(PaymentsStore);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly value = signal('');
  protected readonly open = signal(false);
  private readonly expanded = signal(false);
  private readonly activeIndex = signal(-1);

  protected readonly dropdown = computed(() => buildSearchDropdown(this.value(), this.store.payments(), this.expanded()));
  protected readonly activeOption = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.dropdown().options[index] : undefined;
  });

  constructor() {
    // Adopt URL changes made elsewhere (Clear all, back button) without
    // clobbering in-progress typing such as a trailing space.
    const sync = () => {
      const fromUrl = this.onPayments() ? (this.router.parseUrl(this.router.url).queryParamMap.get('q') ?? '') : '';
      if (fromUrl !== this.value().trim()) this.value.set(fromUrl);
    };
    const subscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(sync);
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());

    // Keep the highlighted option visible while navigating with the keyboard.
    effect(() => {
      const option = this.activeOption();
      if (option) document.getElementById(option.id)?.scrollIntoView({ block: 'nearest' });
    });
  }

  protected update(next: string): void {
    this.value.set(next);
    this.activeIndex.set(-1);
    this.open.set(true);
  }

  protected clear(): void {
    const hadQuery = Boolean(this.router.parseUrl(this.router.url).queryParamMap.get('q'));
    this.update('');
    if (hadQuery && this.onPayments()) this.applyToTable('');
  }

  /**
   * Highlight follows real pointer movement only (mousemove, not mouseenter),
   * so options re-rendering under a resting cursor never steal the highlight.
   */
  protected hover(option: SearchOption): void {
    const index = this.dropdown().options.indexOf(option);
    if (index === this.activeIndex()) return;
    this.activeIndex.set(index);
    if (option.kind === 'payment') this.store.prefetchDetails(option.payment.id);
  }

  protected select(option: SearchOption): void {
    switch (option.kind) {
      case 'filter':
        this.update(applySearchSuggestion(this.value(), option.filter.key, 'filter'));
        break;
      case 'value':
        this.update(applySearchSuggestion(this.value(), option.suggestion.token, 'value'));
        break;
      case 'toggle-filters':
        this.expanded.update((current) => !current);
        this.activeIndex.set(-1);
        break;
      case 'apply':
      case 'view-all':
        this.applyToTable(option.query);
        return;
      case 'payment':
        this.open.set(false);
        void this.router.navigate(['/payments', option.payment.id]);
        return;
    }
    this.input().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.dropdown().options.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.update((index) => (index + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.update((index) => (index <= 0 ? count - 1 : index - 1));
        break;
      case 'Enter': {
        event.preventDefault();
        const option = this.activeOption();
        if (this.open() && option) this.select(option);
        else this.applyToTable(this.value());
        break;
      }
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.open.set(false);
        } else if (this.value()) {
          event.preventDefault();
          this.update('');
          this.open.set(false);
        }
        break;
      case 'Tab':
        this.open.set(false);
        break;
    }
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.input().nativeElement.focus();
    }
  }

  /** Applies the query to the Payments table (`?q=`), keeping the other list filters. */
  protected applyToTable(query: string): void {
    const current = this.onPayments() ? this.router.parseUrl(this.router.url).queryParams : {};
    const queryParams: Record<string, string> = { ...current };
    if (query.trim()) queryParams['q'] = query.trim();
    else delete queryParams['q'];
    delete queryParams['page'];
    void this.router.navigate(['/payments'], { queryParams, replaceUrl: this.onPayments() });
    this.open.set(false);
    this.input().nativeElement.blur();
  }

  protected meta(status: keyof typeof STATUS_META) {
    return STATUS_META[status];
  }

  protected statusIcon(status: keyof typeof STATUS_META): IconName {
    return STATUS_ICON[STATUS_META[status].icon];
  }

  protected money(amount: number, currency: Parameters<typeof formatMoney>[1]): string {
    return formatMoney(amount, currency);
  }

  protected shortDay(iso: string): string {
    return formatShortDay(iso);
  }

  private onPayments(): boolean {
    return this.router.url.split('?')[0] === '/payments';
  }
}
