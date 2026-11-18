import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { ACCOUNT, NAVIGATION, type NavEntry } from './navigation';

/** Every route of this app lives under Transactions → Payments. */
const ACTIVE_HREF = '/payments';

/**
 * Left navigation. Fixed at ≥1040px; below that it is an off-canvas drawer
 * controlled by the top bar's menu button (`open`).
 */
@Component({
  selector: 'app-sidebar',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <aside [id]="navId()" class="sidebar" [attr.data-open]="open()" aria-label="Main navigation">
      <div class="sidebar__header">
        <button type="button" class="account-switcher" [attr.aria-label]="'Account options and switcher, current account ' + account.name">
          <span class="account-switcher__logo" aria-hidden="true">{{ account.logoText }}</span>
          <span class="account-switcher__name">{{ account.name }}</span>
          <svg appIcon="chevron-down" [size]="8"></svg>
        </button>
      </div>

      <nav class="sidebar__nav">
        @for (section of sections; track $index) {
          <div>
            @if (section.title) {
              <h2 class="sidebar__section-title">{{ section.title }}</h2>
            }
            <ul>
              @for (item of section.items; track item.label) {
                <li>
                  @if (item.children) {
                    <button
                      type="button"
                      class="nav-item"
                      [attr.aria-expanded]="isExpanded(item)"
                      [attr.aria-controls]="'nav-group-' + item.label"
                      (click)="toggle(item)"
                    >
                      <svg [appIcon]="item.icon" [size]="16"></svg>
                      <span class="nav-item__label">{{ item.label }}</span>
                      <svg appIcon="chevron-down" [size]="8" class="nav-item__chevron"></svg>
                    </button>
                    @if (isExpanded(item)) {
                      <ul [id]="'nav-group-' + item.label" class="nav-subitems">
                        @for (child of item.children; track child.label) {
                          <li>
                            @if (child.href) {
                              <a
                                class="nav-item"
                                [routerLink]="child.href"
                                [attr.aria-current]="child.href === activeHref ? 'page' : null"
                                (click)="navigate.emit()"
                              >
                                <span class="nav-item__label">{{ child.label }}</span>
                              </a>
                            } @else {
                              <button type="button" class="nav-item">
                                <span class="nav-item__label">{{ child.label }}</span>
                              </button>
                            }
                          </li>
                        }
                      </ul>
                    }
                  } @else if (item.href) {
                    <a
                      class="nav-item"
                      [routerLink]="item.href"
                      [attr.aria-current]="item.href === activeHref ? 'page' : null"
                      (click)="navigate.emit()"
                    >
                      <svg [appIcon]="item.icon" [size]="16"></svg>
                      <span class="nav-item__label">{{ item.label }}</span>
                    </a>
                  } @else {
                    <button type="button" class="nav-item">
                      <svg [appIcon]="item.icon" [size]="16"></svg>
                      <span class="nav-item__label">{{ item.label }}</span>
                    </button>
                  }
                </li>
              }
            </ul>
          </div>
        }
      </nav>

      <div class="sidebar__footer">
        <button type="button" class="nav-item">
          <svg appIcon="nav-developers" [size]="16"></svg>
          <span class="nav-item__label">Developers</span>
        </button>
      </div>
    </aside>
  `,
})
export class Sidebar {
  readonly navId = input.required<string>();
  readonly open = input(false);
  /** Emitted when a link is followed, so the drawer can close. */
  readonly navigate = output<void>();

  protected readonly account = ACCOUNT;
  protected readonly sections = NAVIGATION;
  protected readonly activeHref = ACTIVE_HREF;
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected isExpanded(item: NavEntry): boolean {
    return this.expanded().has(item.label);
  }

  protected toggle(item: NavEntry): void {
    const next = new Set(this.expanded());
    if (next.has(item.label)) next.delete(item.label);
    else next.add(item.label);
    this.expanded.set(next);
  }
}
