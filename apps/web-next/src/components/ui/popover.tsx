'use client';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react';
import type { HTMLProps, ReactNode, Ref } from 'react';

export interface PopoverTriggerProps extends HTMLProps<Element> {
  ref: Ref<Element>;
}

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Renders the trigger; spread the given props onto the clickable element. */
  trigger: (props: Record<string, unknown>) => ReactNode;
  children: ReactNode;
  placement?: Placement;
  /** Accessible role of the surface (`dialog` for filters, `menu` for menus). */
  role?: 'dialog' | 'menu' | 'listbox';
  label?: string;
}

/**
 * Click-triggered floating surface. Moves focus inside on open, returns it to
 * the trigger on close, and closes on Escape or outside press.
 */
export function Popover({ open, onOpenChange, trigger, children, placement = 'bottom-start', role = 'dialog', label }: PopoverProps) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement,
    strategy: 'fixed',
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.max(160, availableHeight)}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role }),
  ]);

  // Floating UI's `refs.setReference` / `refs.setFloating` are stable callback
  // setters, not ref reads, so passing them during render is safe.
  /* eslint-disable react-hooks/refs */
  return (
    <>
      {trigger(getReferenceProps({ ref: refs.setReference }))}
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={0}>
            <div
              ref={refs.setFloating}
              className="popover"
              style={{ ...floatingStyles, overflowY: 'auto' }}
              aria-label={label}
              {...getFloatingProps()}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
  /* eslint-enable react-hooks/refs */
}
