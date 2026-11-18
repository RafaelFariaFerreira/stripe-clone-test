'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { ACCOUNT, NAVIGATION, type NavEntry } from './navigation';

const ACTIVE_HREF = '/payments';

interface SidebarProps {
  id: string;
  open: boolean;
  onNavigate: () => void;
}

/**
 * Left navigation. Fixed at ≥1040px; below that it is an off-canvas drawer
 * controlled by the top bar's menu button (`open`).
 */
export function Sidebar({ id, open, onNavigate }: SidebarProps) {
  // Every route of this app lives under Transactions → Payments, so the active
  // entry is static; this also keeps the sidebar in the prerendered shell.
  const isActive = (href?: string) => href === ACTIVE_HREF;

  return (
    <aside id={id} className="sidebar" data-open={open} aria-label="Main navigation">
      <div className="sidebar__header">
        <button type="button" className="account-switcher" aria-label={`Account options and switcher, current account ${ACCOUNT.name}`}>
          <span className="account-switcher__logo" aria-hidden="true">
            {ACCOUNT.logoText}
          </span>
          <span className="account-switcher__name">{ACCOUNT.name}</span>
          <Icon name="chevron-down" size={8} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAVIGATION.map((section, index) => (
          <div key={section.title ?? index}>
            {section.title ? <h2 className="sidebar__section-title">{section.title}</h2> : null}
            <ul>
              {section.items.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <NavGroup item={item} isActive={isActive} onNavigate={onNavigate} />
                  ) : (
                    <NavLink item={item} active={isActive(item.href)} onNavigate={onNavigate} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <NavLink item={{ label: 'Developers', icon: 'nav-developers' }} active={false} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}

function NavLink({ item, active, onNavigate }: { item: NavEntry; active: boolean; onNavigate: () => void }) {
  const content = (
    <>
      <Icon name={item.icon} size={16} />
      <span className="nav-item__label">{item.label}</span>
    </>
  );
  // Sections outside this clone render as inert buttons so the hierarchy stays complete.
  return item.href ? (
    <Link href={item.href} className="nav-item" aria-current={active ? 'page' : undefined} onClick={onNavigate}>
      {content}
    </Link>
  ) : (
    <button type="button" className="nav-item">
      {content}
    </button>
  );
}

function NavGroup({ item, isActive, onNavigate }: { item: NavEntry; isActive: (href?: string) => boolean; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `nav-group-${item.label.toLowerCase()}`;
  return (
    <>
      <button type="button" className="nav-item" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((value) => !value)}>
        <Icon name={item.icon} size={16} />
        <span className="nav-item__label">{item.label}</span>
        <Icon name="chevron-down" size={8} className="nav-item__chevron" />
      </button>
      {expanded ? (
        <ul id={panelId} className="nav-subitems">
          {item.children?.map((child) => (
            <li key={child.label}>
              {child.href ? (
                <Link href={child.href} className="nav-item" aria-current={isActive(child.href) ? 'page' : undefined} onClick={onNavigate}>
                  <span className="nav-item__label">{child.label}</span>
                </Link>
              ) : (
                <button type="button" className="nav-item">
                  <span className="nav-item__label">{child.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
