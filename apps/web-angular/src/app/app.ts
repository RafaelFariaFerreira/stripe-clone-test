import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShell } from './layout/app-shell';

/** Root component: the Dashboard shell around the routed page. */
@Component({
  selector: 'app-root',
  imports: [AppShell, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="sr-only" href="#main-content">Skip to content</a>
    <app-shell><router-outlet /></app-shell>
  `,
})
export class App {}
