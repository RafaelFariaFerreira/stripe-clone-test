import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../ui/icon';
import { Tooltip } from '../ui/tooltip';
import { GlobalSearch } from './global-search';

/** Sticky top bar: search, test-mode notice, apps shortcut and global actions. */
@Component({
  selector: 'app-topbar',
  imports: [GlobalSearch, Icon, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <header class="topbar">
      <button
        type="button"
        class="icon-button topbar__menu-button"
        aria-label="Toggle navigation menu"
        [attr.aria-expanded]="navOpen()"
        [attr.aria-controls]="navId()"
        (click)="toggleNav.emit()"
      >
        <svg appIcon="menu" [size]="16"></svg>
      </button>
      <app-global-search />

      <div class="topbar__actions">
        <p class="test-mode-notice">
          <span>Test mode has moved.</span>
          <a class="test-mode-notice__link" href="#test-mode">Show me</a>
        </p>

        <div class="app-tray">
          <svg appIcon="nav-apps" [size]="16" label="All apps"></svg>
        </div>

        <button type="button" class="icon-button topbar__icon-button" aria-label="Help" appTooltip="Help">
          <svg appIcon="top-help" [size]="16"></svg>
        </button>
        <button
          type="button"
          class="icon-button topbar__icon-button topbar__icon-button--dot topbar__icon-button--keep"
          aria-label="Notifications, 1 unread"
          appTooltip="Notifications"
        >
          <svg appIcon="top-notifications" [size]="16"></svg>
        </button>
        <button type="button" class="icon-button topbar__icon-button" aria-label="Settings" appTooltip="Settings">
          <svg appIcon="top-settings" [size]="16"></svg>
        </button>
        <button type="button" class="create-button" aria-label="Create" appTooltip="Create">
          <svg appIcon="plus" [size]="12"></svg>
        </button>
      </div>
    </header>
  `,
})
export class Topbar {
  readonly navId = input.required<string>();
  readonly navOpen = input(false);
  readonly toggleNav = output<void>();
}
