import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * Two-column Dashboard frame. Owns the mobile drawer state: it closes when a
 * link inside it is followed, on Escape and when the backdrop is clicked.
 */
@Component({
  selector: 'app-shell',
  imports: [Sidebar, Topbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'navOpen.set(false)' },
  template: `
    <div class="app-shell">
      <app-sidebar [navId]="navId" [open]="navOpen()" (navigate)="navOpen.set(false)" />
      <div class="nav-overlay" [attr.data-open]="navOpen()" aria-hidden="true" (click)="navOpen.set(false)"></div>
      <div class="app-shell__main">
        <app-topbar [navId]="navId" [navOpen]="navOpen()" (toggleNav)="navOpen.set(!navOpen())" />
        <main class="page" id="main-content">
          <ng-content />
        </main>
      </div>
    </div>
  `,
})
export class AppShell {
  protected readonly navId = 'main-navigation';
  protected readonly navOpen = signal(false);
}
