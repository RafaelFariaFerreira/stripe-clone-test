import { ICONS, type IconName } from '@stripe-clone/icons';
import { cx } from '@/lib/cx';

export type IconSize = 8 | 12 | 14 | 16 | 20;

interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** Accessible name. Omit for decorative icons (the default). */
  label?: string;
}

/**
 * Renders an icon from the shared registry. The markup is static, first-party
 * SVG generated at build time, so injecting it is safe.
 */
export function Icon({ name, size = 12, className, label }: IconProps) {
  const icon = ICONS[name];
  return (
    <svg
      className={cx('icon', `icon--${size}`, className)}
      viewBox={icon.viewBox}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

/** Multi-color brand/wallet mark (keeps its own colors). */
export function BrandMark({ name, label }: { name: IconName; label: string }) {
  const icon = ICONS[name];
  return (
    <svg
      className="brand-mark"
      viewBox={icon.viewBox}
      role="img"
      aria-label={label}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: `<title>${label}</title>${icon.body}` }}
    />
  );
}
