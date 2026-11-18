'use client';

import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { usePreference } from '@/lib/use-preference';

const STORAGE_KEY = 'payments.banner.rule-attributes.dismissed';

/** "New" announcement above the status cards; dismissal is remembered per browser. */
export function AnnouncementBanner() {
  const [dismissed, setDismissed] = usePreference(STORAGE_KEY, false);
  if (dismissed) return null;
  return (
    <section className="banner" aria-label="Announcement">
      <span className="banner__tag">
        <Icon name="sparkle" size={12} />
        New
      </span>
      <p className="banner__message">Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.</p>
      <div className="banner__actions">
        <a className="link" href="#get-started">
          Get started
        </a>
        <span className="vertical-divider" aria-hidden="true" />
        <IconButton
          icon="close"
          label="Dismiss announcement"
          size="sm"
          className="banner__close"
          onClick={() => setDismissed(true)}
        />
      </div>
    </section>
  );
}
