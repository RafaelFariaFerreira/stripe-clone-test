import { Suspense } from 'react';
import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tooltip } from '@/components/ui/tooltip';
import { GlobalSearch, GlobalSearchFallback } from './global-search';

interface TopbarProps {
  navId: string;
  navOpen: boolean;
  onToggleNav: () => void;
}

/** Sticky top bar: search, test-mode notice, apps shortcut and global actions. */
export function Topbar({ navId, navOpen, onToggleNav }: TopbarProps) {
  return (
    <header className="topbar">
      <IconButton
        icon="menu"
        iconSize={16}
        label="Toggle navigation menu"
        className="topbar__menu-button"
        aria-expanded={navOpen}
        aria-controls={navId}
        onClick={onToggleNav}
      />
      <Suspense fallback={<GlobalSearchFallback />}>
        <GlobalSearch />
      </Suspense>

      <div className="topbar__actions">
        <p className="test-mode-notice">
          <span>Test mode has moved.</span>
          <a className="test-mode-notice__link" href="#test-mode">
            Show me
          </a>
        </p>

        <div className="app-tray">
          <Icon name="nav-apps" size={16} label="All apps" />
        </div>

        <Tooltip content="Help">
          <IconButton icon="top-help" iconSize={16} label="Help" className="topbar__icon-button" />
        </Tooltip>
        <Tooltip content="Notifications">
          <IconButton icon="top-notifications" iconSize={16} label="Notifications, 1 unread" className="topbar__icon-button topbar__icon-button--dot topbar__icon-button--keep" />
        </Tooltip>
        <Tooltip content="Settings">
          <IconButton icon="top-settings" iconSize={16} label="Settings" className="topbar__icon-button" />
        </Tooltip>
        <Tooltip content="Create">
          <button type="button" className="create-button" aria-label="Create">
            <Icon name="plus" size={12} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
