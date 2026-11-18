import { COLUMN_BY_ID, COLUMNS, ACTIONS_COLUMN_WIDTH, MAX_COLUMN_WIDTH, SELECT_COLUMN_WIDTH, type ColumnId } from './columns';

/**
 * User-adjusted layout of the Payments table: column order and widths.
 * Pure functions; each app keeps it in a persisted preference.
 */
export interface ColumnLayout {
  /** Every column id, in display order (hidden columns keep their slot). */
  order: ColumnId[];
  /** Widths that differ from the defaults, in px. */
  widths: Partial<Record<ColumnId, number>>;
}

export const DEFAULT_COLUMN_LAYOUT: Readonly<ColumnLayout> = Object.freeze({ order: COLUMNS.map((column) => column.id), widths: {} });

const isColumnId = (value: unknown): value is ColumnId => typeof value === 'string' && value in COLUMN_BY_ID;

/** Clamps a width to the column's [min, MAX] range (whole pixels). */
export function clampColumnWidth(id: ColumnId, width: number): number {
  return Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(COLUMN_BY_ID[id].minWidth, width)));
}

/**
 * Sanitizes a stored layout: unknown ids are dropped, missing ones appended in
 * their default position order, and widths clamped. Safe for any input.
 */
export function normalizeColumnLayout(value: unknown): ColumnLayout {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as { order?: unknown; widths?: unknown };
  const order = Array.isArray(raw.order) ? [...new Set(raw.order.filter(isColumnId))] : [];
  for (const column of COLUMNS) if (!order.includes(column.id)) order.push(column.id);
  const widths: Partial<Record<ColumnId, number>> = {};
  if (typeof raw.widths === 'object' && raw.widths !== null) {
    for (const [id, width] of Object.entries(raw.widths)) {
      if (isColumnId(id) && typeof width === 'number' && Number.isFinite(width)) widths[id] = clampColumnWidth(id, width);
    }
  }
  return { order, widths };
}

export function columnWidth(layout: ColumnLayout, id: ColumnId): number {
  return layout.widths[id] ?? COLUMN_BY_ID[id].defaultWidth;
}

/** Changes one column's width; every other column keeps its width. */
export function resizeColumn(layout: ColumnLayout, id: ColumnId, width: number): ColumnLayout {
  return { ...layout, widths: { ...layout.widths, [id]: clampColumnWidth(id, width) } };
}

/** Restores one column's default width. */
export function resetColumnWidth(layout: ColumnLayout, id: ColumnId): ColumnLayout {
  const widths = { ...layout.widths };
  delete widths[id];
  return { ...layout, widths };
}

/**
 * Moves `id` so it sits right before `beforeId` (`null` = after the last
 * column). Working with ids keeps hidden columns in their relative slots.
 */
export function moveColumn(layout: ColumnLayout, id: ColumnId, beforeId: ColumnId | null): ColumnLayout {
  if (id === beforeId) return layout;
  const order = layout.order.filter((item) => item !== id);
  const index = beforeId === null ? order.length : order.indexOf(beforeId);
  order.splice(index < 0 ? order.length : index, 0, id);
  return { ...layout, order };
}

/** Moves a column one step among the visible columns (keyboard reordering). */
export function moveColumnBy(layout: ColumnLayout, visible: readonly ColumnId[], id: ColumnId, step: -1 | 1): ColumnLayout {
  const ordered = visibleColumnOrder(layout, visible);
  const index = ordered.indexOf(id);
  const target = index + step;
  if (index < 0 || target < 0 || target >= ordered.length) return layout;
  // Moving right means inserting before the column two slots ahead (or at the end).
  const beforeId = step === -1 ? (ordered[target] ?? null) : (ordered[target + 1] ?? null);
  return moveColumn(layout, id, beforeId);
}

/** Visible columns in layout order. */
export function visibleColumnOrder(layout: ColumnLayout, visible: Iterable<ColumnId>): ColumnId[] {
  const set = new Set(visible);
  return layout.order.filter((id) => set.has(id));
}

/**
 * Where a dragged column would drop, given the header cells' horizontal
 * centers: before the first column whose center is right of the pointer.
 * Returns `undefined` when the drop would not change the order.
 */
export function columnDropTarget(
  cells: ReadonlyArray<{ id: ColumnId; center: number }>,
  pointerX: number,
  draggedId: ColumnId,
): { beforeId: ColumnId | null; index: number } | undefined {
  let index = cells.findIndex((cell) => pointerX < cell.center);
  if (index < 0) index = cells.length;
  const draggedIndex = cells.findIndex((cell) => cell.id === draggedId);
  if (index === draggedIndex || index === draggedIndex + 1) return undefined;
  return { beforeId: cells[index]?.id ?? null, index };
}

/** Minimum table width: the sum of visible column widths plus the fixed columns. */
export function tableMinWidth(layout: ColumnLayout, visible: Iterable<ColumnId>): number {
  return visibleColumnOrder(layout, visible).reduce((sum, id) => sum + columnWidth(layout, id), SELECT_COLUMN_WIDTH + ACTIONS_COLUMN_WIDTH);
}
