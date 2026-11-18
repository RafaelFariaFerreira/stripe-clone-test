'use client';

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react';
import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode, type Ref } from 'react';

interface TooltipProps {
  content: ReactNode;
  /** A single focusable element (button, link…) that receives the trigger props. */
  children: ReactElement<Record<string, unknown> & { ref?: Ref<Element> }>;
  placement?: Placement;
  /** Delay before showing, in ms. Hiding is immediate, like the Dashboard. */
  delay?: number;
  /** Called while the tooltip is open, e.g. to refresh relative times. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dark tooltip shown on hover **and** keyboard focus, wired with
 * `aria-describedby` by Floating UI's `useRole`.
 */
export function Tooltip({ content, children, placement = 'top', delay = 300, onOpenChange }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    placement,
    strategy: 'fixed',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: { open: delay, close: 0 }, move: false }),
    useFocus(context),
    useDismiss(context),
    useRole(context, { role: 'tooltip' }),
  ]);

  if (!isValidElement(children)) return children;

  // Floating UI's `refs.setReference` / `refs.setFloating` are stable callback
  // setters, not ref reads, so passing them during render is safe.
  /* eslint-disable react-hooks/refs */
  return (
    <>
      {cloneElement(children, getReferenceProps({ ref: refs.setReference, ...children.props }))}
      {open && content ? (
        <FloatingPortal>
          <div ref={refs.setFloating} className="tooltip" style={floatingStyles} {...getFloatingProps()}>
            {content}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
  /* eslint-enable react-hooks/refs */
}
