import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, type IconName } from '@stripe-clone/icons';

export type IconSize = 8 | 12 | 14 | 16 | 20;

/**
 * Icon from the shared registry, applied to an `<svg>` element:
 * `<svg appIcon="search" [size]="12"></svg>`.
 *
 * The markup is static, first-party SVG generated at build time, so it is
 * marked as trusted instead of being sanitized away.
 */
@Component({
  selector: 'svg[appIcon]',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"icon icon--" + size()',
    '[attr.viewBox]': 'definition().viewBox',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    focusable: 'false',
    '[innerHTML]': 'body()',
  },
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>({ alias: 'appIcon' });
  readonly size = input<IconSize>(12);
  /** Accessible name; omit for decorative icons (the default). */
  readonly label = input<string>();

  protected readonly definition = computed(() => ICONS[this.name()]);
  protected readonly body = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.definition().body));
}

/** Multi-color brand/wallet mark that keeps its own colors: `<svg appBrandMark="card-visa" label="Visa">`. */
@Component({
  selector: 'svg[appBrandMark]',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'brand-mark',
    role: 'img',
    focusable: 'false',
    '[attr.viewBox]': 'definition().viewBox',
    '[attr.aria-label]': 'label()',
    '[innerHTML]': 'body()',
  },
})
export class BrandMark {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>({ alias: 'appBrandMark' });
  readonly label = input.required<string>();

  protected readonly definition = computed(() => ICONS[this.name()]);
  protected readonly body = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(`<title>${this.label()}</title>${this.definition().body}`),
  );
}
