'use client';

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
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';

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
  label: string;
  /** Pointer position, for the floating ghost. */
  x: number;
  y: number;
  /** Drop indicator position, relative to the scroller's content box. */
  indicatorX: number | null;
}

interface Options {
  layout: ColumnLayout;
  /** Visible column ids in display order. */
  columns: readonly ColumnId[];
  onLayoutChange: (layout: ColumnLayout) => void;
}

/**
 * Column resizing and reordering for the payments table.
 *
 * - Resize borders are always rendered; they become visible once the pointer
 *   rests on the header for 2s. Only their color changes, so nothing reflows.
 * - Dragging a border changes only that column's width (a filler column
 *   absorbs the difference), previewed live and committed once on release.
 * - Pressing a header and dragging it horizontally reorders the column; a
 *   plain click still sorts.
 * - Keyboard: ←/→ on a focused border resizes (Shift for bigger steps, Enter
 *   resets), Alt+←/→ on a header control moves the column.
 */
export function useColumnInteractions({ layout, columns, onLayoutChange }: Options) {
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState<{ id: ColumnId; width: number } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const headerCells = useRef(new Map<ColumnId, HTMLTableCellElement>());
  const suppressClick = useRef(false);

  useEffect(() => () => clearTimeout(revealTimer.current), []);

  const interacting = Boolean(draft || drag);
  const widthOf = (id: ColumnId) => (draft?.id === id ? draft.width : columnWidth(layout, id));
  const previewLayout = draft ? resizeColumn(layout, draft.id, draft.width) : layout;

  // --- Reveal the borders once the pointer rests on the header ---------------
  const headProps = {
    onPointerMove: () => {
      if (revealed) return;
      clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setRevealed(true), RESIZER_REVEAL_DELAY_MS);
    },
    onPointerLeave: () => {
      clearTimeout(revealTimer.current);
      setRevealed(false);
    },
    // The click that ends a drag must not also sort the column.
    onClickCapture: (event: MouseEvent) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };

  // --- Reorder by dragging a header --------------------------------------------
  const startReorder = (event: PointerEvent<HTMLTableCellElement>, id: ColumnId, label: string) => {
    // Mouse and pen only: on touch, horizontal swipes scroll the table.
    if (event.button !== 0 || event.pointerType === 'touch') return;
    if ((event.target as HTMLElement).closest('.column-resizer, input')) return;

    const startX = event.clientX;
    let active = false;
    let beforeId: ColumnId | null | undefined;

    const onMove = (move: globalThis.PointerEvent) => {
      if (!active && Math.abs(move.clientX - startX) <= DRAG_THRESHOLD) return;
      active = true;

      const scroller = headerCells.current.get(id)?.closest<HTMLElement>('.table-scroll');
      if (!scroller) return;
      const box = scroller.getBoundingClientRect();
      if (move.clientX < box.left + EDGE) scroller.scrollLeft -= EDGE_STEP;
      else if (move.clientX > box.right - EDGE) scroller.scrollLeft += EDGE_STEP;

      const cells = columns.flatMap((columnId) => {
        const rect = headerCells.current.get(columnId)?.getBoundingClientRect();
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
      const indicatorX = edge === undefined ? null : edge - box.left + scroller.scrollLeft;
      setDrag({ id, label, x: move.clientX, y: move.clientY, indicatorX });
    };

    const onEnd = (end: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      if (!active) return;
      setDrag(null);
      suppressClick.current = end.type === 'pointerup';
      // If no click follows (the pointer left the header), don't swallow a later one.
      setTimeout(() => (suppressClick.current = false), 0);
      if (beforeId !== undefined && end.type === 'pointerup') onLayoutChange(moveColumn(layout, id, beforeId));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  };

  const headerCellProps = (id: ColumnId, label: string) => ({
    ref: (element: HTMLTableCellElement | null) => {
      if (element) headerCells.current.set(id, element);
      else headerCells.current.delete(id);
    },
    'data-reorderable': true,
    'data-dragging': drag?.id === id ? true : undefined,
    onPointerDown: (event: PointerEvent<HTMLTableCellElement>) => startReorder(event, id, label),
  });

  /** Alt+←/→ moves the column one slot. Returns whether the key was handled. */
  const onReorderKeyDown = (id: ColumnId, event: KeyboardEvent) => {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return false;
    event.preventDefault();
    onLayoutChange(moveColumnBy(layout, columns, id, event.key === 'ArrowLeft' ? -1 : 1));
    return true;
  };

  // --- Resize by dragging a border ---------------------------------------------
  const startResize = (event: PointerEvent<HTMLSpanElement>, id: ColumnId) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const startWidth = columnWidth(layout, id);
    let latest = startWidth;
    handle.setPointerCapture(event.pointerId);
    setDraft({ id, width: startWidth });

    const onMove = (move: globalThis.PointerEvent) => {
      latest = clampColumnWidth(id, startWidth + move.clientX - startX);
      setDraft({ id, width: latest });
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      setDraft(null);
      if (latest !== startWidth) onLayoutChange(resizeColumn(layout, id, latest));
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  };

  const resizerProps = (id: ColumnId, name: string) => ({
    className: 'column-resizer',
    role: 'separator',
    tabIndex: 0,
    'aria-orientation': 'vertical' as const,
    'aria-label': `Resize ${name} column`,
    'aria-valuenow': widthOf(id),
    'data-active': draft?.id === id ? true : undefined,
    onPointerDown: (event: PointerEvent<HTMLSpanElement>) => startResize(event, id),
    onClick: (event: MouseEvent) => event.stopPropagation(),
    onDoubleClick: (event: MouseEvent) => {
      event.stopPropagation();
      onLayoutChange(resetColumnWidth(layout, id));
    },
    onKeyDown: (event: KeyboardEvent<HTMLSpanElement>) => {
      if (onReorderKeyDown(id, event)) return;
      const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        onLayoutChange(resizeColumn(layout, id, columnWidth(layout, id) + (event.key === 'ArrowLeft' ? -step : step)));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onLayoutChange(resetColumnWidth(layout, id));
      }
    },
  });

  return {
    widthOf,
    minTableWidth: tableMinWidth(previewLayout, columns),
    tableState: {
      'data-show-resizers': revealed || interacting ? true : undefined,
      'data-interacting': drag ? true : undefined,
      'data-resizing': draft ? true : undefined,
    },
    headProps,
    headerCellProps,
    resizerProps,
    onReorderKeyDown,
    draggingId: drag?.id ?? null,
    ghost: drag ? { x: drag.x, y: drag.y, label: drag.label } : null,
    indicatorX: drag?.indicatorX ?? null,
  };
}
