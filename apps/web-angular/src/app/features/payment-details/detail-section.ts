import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Spinner } from '../../ui/feedback';

/**
 * Titled section of the details page. Shows a spinner while `loading`, an
 * inline error when `failed`, otherwise the projected content. An optional
 * `[sectionAction]` element is projected next to the title.
 */
@Component({
  selector: 'app-detail-section',
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.aria-labelledby]="headingId()" [attr.aria-busy]="loading() || null">
      <div class="detail-section__header">
        <h2 class="detail-section__title" [id]="headingId()">{{ title() }}</h2>
        <ng-content select="[sectionAction]" />
      </div>
      <div class="detail-section__body">
        @if (failed()) {
          <p class="note">This section couldn't be loaded.</p>
        } @else if (loading()) {
          <div class="detail-section__loading"><app-spinner [label]="'Loading ' + title().toLowerCase()" /></div>
        } @else {
          <ng-content />
        }
      </div>
    </section>
  `,
  host: { style: 'display: block' },
})
export class DetailSection {
  readonly title = input.required<string>();
  readonly loading = input(false);
  readonly failed = input(false);
  protected readonly headingId = computed(() => `section-${this.title().toLowerCase().replaceAll(' ', '-')}`);
}
