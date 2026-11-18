import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PAGE_SIZES, type PageSize, type QueryResult } from '@stripe-clone/domain';

/** "Viewing 1–25 of 600 results", rows-per-page select and Previous / Next. */
@Component({
  selector: 'app-pagination',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <nav class="pagination" aria-label="Pagination">
      <p class="pagination__summary" aria-live="polite">
        Viewing <strong>{{ result().rangeStart | number }}–{{ result().rangeEnd | number }}</strong> of
        <strong>{{ result().total | number }}</strong> results
      </p>
      <div class="pagination__controls">
        <label class="pagination__page-size">
          Rows per page
          <select name="page-size" class="select select--sm" (change)="onSize($event)">
            @for (size of sizes; track size) {
              <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          class="button button--secondary button--sm"
          [disabled]="result().page <= 1"
          (click)="pageChange.emit(result().page - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="button button--secondary button--sm"
          [disabled]="result().page >= result().pageCount"
          (click)="pageChange.emit(result().page + 1)"
        >
          Next
        </button>
      </div>
    </nav>
  `,
})
export class Pagination {
  readonly result = input.required<Pick<QueryResult<unknown>, 'page' | 'pageCount' | 'total' | 'rangeStart' | 'rangeEnd'>>();
  readonly pageSize = input.required<PageSize>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<PageSize>();

  protected readonly sizes = PAGE_SIZES;

  protected onSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if ((PAGE_SIZES as readonly number[]).includes(value)) this.pageSizeChange.emit(value as PageSize);
  }
}
