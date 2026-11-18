import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One CSS custom property declared in `packages/styles/src/tokens.css`. */
export interface DesignToken {
  name: string;
  value: string;
}

/** Tokens grouped by the section comments of the tokens file (`/* Text colors --- *\/`). */
export interface TokenGroup {
  title: string;
  tokens: DesignToken[];
}

/**
 * Reads the design tokens straight from the shared stylesheet at build time,
 * so the style guide can never drift from the CSS the apps actually ship.
 * Runs on the server only (the page is prerendered).
 */
export function readTokenGroups(): TokenGroup[] {
  const source = readFileSync(join(process.cwd(), '../../packages/styles/src/tokens.css'), 'utf8');
  // Only the first :root block holds the tokens (the second is the reduced-motion override).
  const body = source.slice(source.indexOf(':root {'), source.indexOf('@media'));

  const groups: TokenGroup[] = [];
  let current: TokenGroup = { title: 'General', tokens: [] };
  // Declarations can span lines (font stacks), so tokenize on `;` and section comments.
  const pattern = /\/\*\s*([^*]+?)\s*-+\s*\*\/|(--[\w-]+)\s*:\s*([^;]+);/g;
  for (const match of body.matchAll(pattern)) {
    const [, title, name, value] = match;
    if (title) {
      if (current.tokens.length) groups.push(current);
      current = { title, tokens: [] };
    } else if (name && value) {
      current.tokens.push({ name, value: value.replace(/\s+/g, ' ').trim() });
    }
  }
  if (current.tokens.length) groups.push(current);
  return groups;
}
