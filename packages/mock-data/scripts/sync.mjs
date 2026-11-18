/**
 * Copies the generated dataset into each app's static folder, so it is served
 * as plain, cacheable files (`/data/payments.json`, `/data/details/<n>.json`).
 *
 *   node scripts/sync.mjs <targetPublicDir> [...more]
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node scripts/sync.mjs <targetPublicDir> [...more]');
  process.exit(1);
}
for (const target of targets) {
  const destination = join(resolve(target), 'data');
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
  console.log(`Synced mock data → ${destination}`);
}
