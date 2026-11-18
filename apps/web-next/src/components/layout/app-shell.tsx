'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const NAV_ID = 'main-navigation';

/**
 * Two-column Dashboard frame. Owns the mobile drawer state: it closes when a
 * link inside it is followed, on Escape and when the backdrop is clicked.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  return (
    <div className="app-shell">
      <Sidebar id={NAV_ID} open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="nav-overlay" data-open={navOpen} onClick={() => setNavOpen(false)} aria-hidden="true" />
      <div className="app-shell__main">
        <Topbar navId={NAV_ID} navOpen={navOpen} onToggleNav={() => setNavOpen((open) => !open)} />
        <main className="page" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
