import type { CSSProperties } from 'react';

/** Thin ring spinner used while a section is loading. */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

/** Shimmering placeholder block that reserves the final content size. */
export function Skeleton({ width, height = 12, style }: { width: number | string; height?: number; style?: CSSProperties }) {
  return <span className="skeleton" aria-hidden="true" style={{ width, height, ...style }} />;
}
