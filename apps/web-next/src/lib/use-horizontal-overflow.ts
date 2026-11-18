'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a horizontally scrollable element has hidden content on its
 * right edge. The table uses it to show the sticky column's shadow only when
 * there is something underneath it, like the Dashboard.
 *
 * `mounted` re-attaches the observers when the element appears (the table is
 * only rendered once data has loaded).
 */
export function useHorizontalOverflow<T extends HTMLElement>(mounted: boolean) {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setOverflowing(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [mounted]);

  return { ref, overflowing };
}
