import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-found">
      <h1 class="not-found__title">Page not found</h1>
      <p class="not-found__text">The page you are looking for doesn't exist.</p>
      <a routerLink="/payments" class="button button--secondary">Go to payments</a>
    </div>
  `,
})
export class NotFound {}
