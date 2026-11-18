import { A11yModule } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { paymentsToCsv, type Payment } from '@stripe-clone/domain';
import { Icon } from '../../ui/icon';
import { COLUMNS, type ColumnId } from './columns';
import { POPOVER_POSITIONS } from './filters/filter-pill';

/** `Export` and `Edit columns`, right-aligned in the filter toolbar. */
@Component({
  selector: 'app-table-actions',
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="filter-toolbar__actions">
      <button type="button" class="button button--secondary" [disabled]="rows().length === 0" (click)="exportCsv()">
        <svg appIcon="export" [size]="12"></svg>
        <span>Export</span>
      </button>
      <button
        #trigger
        type="button"
        class="button button--secondary"
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        <svg appIcon="gear" [size]="12"></svg>
        <span>Edit columns</span>
      </button>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="onOutsideClick($event, trigger)"
      (overlayKeydown)="onKeydown($event)"
      (detach)="open.set(false)"
    >
      <div class="popover popover--in-pane" role="dialog" aria-label="Edit columns" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
        <div class="filter-panel">
          <div class="filter-panel__header"><span class="filter-panel__title">Columns</span></div>
          <div class="filter-panel__body">
            @for (column of hideable; track column.id) {
              <label class="check-option">
                <input
                  type="checkbox"
                  class="checkbox"
                  name="visible-columns"
                  [checked]="visible().has(column.id)"
                  (change)="toggle(column.id)"
                />
                <span class="check-option__label">{{ column.name }}</span>
              </label>
            }
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class TableActions {
  readonly rows = input.required<readonly Payment[]>();
  readonly visible = input.required<ReadonlySet<ColumnId>>();
  readonly visibleChange = output<Set<ColumnId>>();

  protected readonly open = signal(false);
  protected readonly positions = POPOVER_POSITIONS.slice().reverse();
  protected readonly hideable = COLUMNS.filter((column) => column.hideable);

  protected toggle(id: ColumnId): void {
    const next = new Set(this.visible());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.visibleChange.emit(next);
  }

  /** Clicking the trigger itself toggles; anything else outside closes. */
  protected onOutsideClick(event: MouseEvent, trigger: HTMLElement): void {
    if (!trigger.contains(event.target as Node)) this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.open.set(false);
  }

  /** Downloads the current filtered + sorted view (all pages) as CSV. */
  protected exportCsv(): void {
    const blob = new Blob([paymentsToCsv(this.rows())], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
