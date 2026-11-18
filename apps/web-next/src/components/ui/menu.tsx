'use client';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
  type Placement,
} from '@floating-ui/react';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/lib/cx';

interface MenuContextValue {
  activeIndex: number | null;
  getItemProps: (props?: Record<string, unknown>) => Record<string, unknown>;
  close: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

interface MenuProps {
  /** Renders the trigger; spread the given props onto the clickable element. */
  trigger: (props: Record<string, unknown>) => ReactNode;
  label: string;
  placement?: Placement;
  children: ReactNode;
}

/**
 * Accessible action menu: `role="menu"`, roving focus with arrow keys,
 * Escape/outside click to close, focus returned to the trigger.
 */
export function Menu({ trigger, label, placement = 'bottom-end', children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: 'fixed',
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: 'menu' }),
    useListNavigation(context, { listRef: elementsRef, activeIndex, onNavigate: setActiveIndex, loop: true }),
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
              className="popover menu"
              style={floatingStyles}
              aria-label={label}
              {...getFloatingProps()}
            >
              <MenuContext.Provider value={{ activeIndex, getItemProps, close: () => setOpen(false) }}>
                <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
                  {children}
                </FloatingList>
              </MenuContext.Provider>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
  /* eslint-enable react-hooks/refs */
}

interface MenuItemProps {
  children: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export function MenuItem({ children, onSelect, tone = 'default', disabled }: MenuItemProps) {
  const menu = useContext(MenuContext);
  const { ref, index } = useListItem({ label: typeof children === 'string' ? children : null });
  if (!menu) throw new Error('MenuItem must be rendered inside <Menu>.');
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      className={cx('menu__item', tone === 'danger' && 'menu__item--danger')}
      tabIndex={menu.activeIndex === index ? 0 : -1}
      aria-disabled={disabled || undefined}
      {...menu.getItemProps({
        onClick: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          if (disabled) return;
          onSelect();
          menu.close();
        },
      })}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="menu__label">{children}</div>;
}

export function MenuDivider() {
  return <div className="menu__divider" role="separator" />;
}
