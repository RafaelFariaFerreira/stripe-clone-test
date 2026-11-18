import { computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import {
  clampColumnWidth,
  columnDropTarget,
  columnWidth,
  moveColumn,
  moveColumnBy,
  resetColumnWidth,
  resizeColumn,
  tableMinWidth,
  type ColumnId,
  type ColumnLayout,
} from '@stripe-clone/domain';

/** How long the pointer must rest on the header before the resize borders appear. */
export const RESIZER_REVEAL_DELAY_MS = 2000;
/** Pointer travel (px) that turns a press on a header into a drag. */
const DRAG_THRESHOLD = 5;
/** Keyboard resize steps (px). */
const KEY_STEP = 8;
const KEY_STEP_LARGE = 32;
/** Distance from the scroller's edge that auto-scrolls while dragging, and the scroll step. */
const EDGE = 40;
const EDGE_STEP = 12;

interface DragState {
  id: ColumnId;
  indicatorX: number | null;
}

/**
 * Column resizing and reordering for the payments table (the Angular twin of
 * the Next `useColumnInteractions` hook; the rules live in @stripe-clone/domain).
 *
 * - Resize borders are always rendered; they become visible once the pointer
 *   rests on the header for 2s. Only their color changes, so nothing reflows.
 * - Dragging a border changes only that column's width (a filler column
 *   absorbs the difference), previewed live and committed once on release.
 * - Pressing a header and dragging it horizontally reorders the column; a
 *   plain click still sorts.
 * - Keyboard: ←/→ on a focused border resizes (Shift for bigger steps, Enter
 *   resets), Alt+←/→ on a header control moves the column.
 *
 * Must be created in an injection context.
 */
export class ColumnInteractions {
  readonly revealed = signal(false);
  readonly draft = signal<{ id: ColumnId; width: number } | null>(null);
  readonly drag = signal<DragState | null>(null);

  readonly showResizers = computed(() => this.revealed() || Boolean(this.draft() || this.drag()));
  readonly minTableWidth = computed(() => {
    const draft = this.draft();
    const layout = draft ? resizeColumn(this.layout(), draft.id, draft.width) : this.layout();
    return tableMinWidth(layout, this.columns());
  });

  private revealTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressClick = false;
  private ghost: HTMLElement | null = null;
  private cleanup: (() => void) | null = null;
  private readonly layout: Signal<ColumnLayout>;
  /** Visible column ids in display order. */
  private readonly columns: Signal<readonly ColumnId[]>;
  private readonly commit: (layout: ColumnLayout) => void;

  constructor(layout: Signal<ColumnLayout>, columns: Signal<readonly ColumnId[]>, commit: (layout: ColumnLayout) => void) {
    this.layout = layout;
    this.columns = columns;
    this.commit = commit;
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.revealTimer);
      this.cleanup?.();
    });
  }

  widthOf(id: ColumnId): number {
    const draft = this.draft();
    return draft?.id === id ? draft.width : columnWidth(this.layout(), id);
  }

  // --- Reveal the borders once the pointer rests on the header ---------------
  onHeadPointerMove(): void {
    if (this.revealed()) return;
    clearTimeout(this.revealTimer);
    this.revealTimer = setTimeout(() => this.revealed.set(true), RESIZER_REVEAL_DELAY_MS);
  }

  onHeadPointerLeave(): void {
    clearTimeout(this.revealTimer);
    this.revealed.set(false);
  }

  /**
   * The click that ends a drag must not also sort the column: header controls
   * call this first and skip their action when it returns true.
   */
  consumeDragClick(): boolean {
    if (!this.suppressClick) return false;
    this.suppressClick = false;
    return true;
  }

  // --- Reorder by dragging a header --------------------------------------------
  startReorder(event: PointerEvent, id: ColumnId, label: string): void {
    // Mouse and pen only: on touch, horizontal swipes scroll the table.
    if (event.button !== 0 || event.pointerType === 'touch') return;
    if ((event.target as HTMLElement).closest('.column-resizer, input')) return;

    // Header cells carry `data-column-id`; their rects drive the drop target.
    const row = (event.currentTarget as HTMLElement).closest('tr');
    const cellOf = (columnId: ColumnId) => row?.querySelector<HTMLElement>(`[data-column-id="${columnId}"]`);
    const startX = event.clientX;
    let active = false;
    let beforeId: ColumnId | null | undefined;

    const onMove = (move: PointerEvent) => {
      if (!active && Math.abs(move.clientX - startX) <= DRAG_THRESHOLD) return;
      active = true;

      const scroller = cellOf(id)?.closest<HTMLElement>('.table-scroll');
      if (!scroller) return;
      const box = scroller.getBoundingClientRect();
      if (move.clientX < box.left + EDGE) scroller.scrollLeft -= EDGE_STEP;
      else if (move.clientX > box.right - EDGE) scroller.scrollLeft += EDGE_STEP;

      const cells = this.columns().flatMap((columnId) => {
        const rect = cellOf(columnId)?.getBoundingClientRect();
        return rect ? [{ id: columnId, rect }] : [];
      });
      const target = columnDropTarget(
        cells.map((cell) => ({ id: cell.id, center: cell.rect.left + cell.rect.width / 2 })),
        move.clientX,
        id,
      );
      beforeId = target?.beforeId;
      const edge = target
        ? target.beforeId
          ? cells.find((cell) => cell.id === target.beforeId)?.rect.left
          : cells.at(-1)?.rect.right
        : undefined;
      this.drag.set({ id, indicatorX: edge === undefined ? null : edge - box.left + scroller.scrollLeft });
      this.moveGhost(label, move.clientX, move.clientY);
    };

    const onEnd = (end: PointerEvent) => {
      this.cleanup?.();
      if (!active) return;
      this.drag.set(null);
      this.suppressClick = end.type === 'pointerup';
      // If no click follows (the pointer left the header), don't swallow a later one.
      setTimeout(() => (this.suppressClick = false), 0);
      if (beforeId !== undefined && end.type === 'pointerup') this.commit(moveColumn(this.layout(), id, beforeId));
    };

    this.cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      this.ghost?.remove();
      this.ghost = null;
      this.cleanup = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  }

  /** Floating label that follows the pointer; lives on <body> so no scroller clips it. */
  private moveGhost(label: string, x: number, y: number): void {
    if (!this.ghost) {
      this.ghost = document.createElement('span');
      this.ghost.className = 'column-drag-ghost';
      this.ghost.setAttribute('aria-hidden', 'true');
      this.ghost.textContent = label;
      document.body.append(this.ghost);
    }
    this.ghost.style.left = `${x}px`;
    this.ghost.style.top = `${y}px`;
  }

  /** Alt+←/→ moves the column one slot. Returns whether the key was handled. */
  onReorderKeyDown(id: ColumnId, event: KeyboardEvent): boolean {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return false;
    event.preventDefault();
    this.commit(moveColumnBy(this.layout(), this.columns(), id, event.key === 'ArrowLeft' ? -1 : 1));
    return true;
  }

  // --- Resize by dragging a border ---------------------------------------------
  startResize(event: PointerEvent, id: ColumnId): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const startWidth = columnWidth(this.layout(), id);
    let latest = startWidth;
    handle.setPointerCapture(event.pointerId);
    this.draft.set({ id, width: startWidth });

    const onMove = (move: PointerEvent) => {
      latest = clampColumnWidth(id, startWidth + move.clientX - startX);
      this.draft.set({ id, width: latest });
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      this.draft.set(null);
      if (latest !== startWidth) this.commit(resizeColumn(this.layout(), id, latest));
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }

  resetWidth(id: ColumnId): void {
    this.commit(resetColumnWidth(this.layout(), id));
  }

  onResizerKeyDown(id: ColumnId, event: KeyboardEvent): void {
    if (this.onReorderKeyDown(id, event)) return;
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const layout = this.layout();
      this.commit(resizeColumn(layout, id, columnWidth(layout, id) + (event.key === 'ArrowLeft' ? -step : step)));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.resetWidth(id);
    }
  }
}
