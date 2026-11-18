import { ICONS } from './registry';

export { ICONS };

/** Every icon available to the apps, derived from the SVG file names. */
export type IconName = keyof typeof ICONS;

export interface IconDefinition {
  viewBox: string;
  /** Inner SVG markup (paths, groups). Static and first-party. */
  body: string;
  /** Brand marks keep their own colors instead of inheriting `currentColor`. */
  multicolor: boolean;
}

/** Looks up an icon; typed so only existing names compile. */
export function getIcon(name: IconName): IconDefinition {
  return ICONS[name];
}
