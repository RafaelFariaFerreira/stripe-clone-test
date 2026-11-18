import { defineConfig, devices } from '@playwright/test';

/**
 * The same specs run against both implementations: identical markup classes
 * and copy are part of the contract, so one suite proves feature parity.
 * Existing dev servers are reused; otherwise Playwright starts them.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Dev servers compile routes on demand; a couple of workers keeps them responsive.
  workers: 2,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1490, height: 1140 },
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    { name: 'next', use: { baseURL: 'http://localhost:3000' } },
    { name: 'angular', use: { baseURL: 'http://localhost:4200' } },
  ],
  webServer: [
    { command: 'pnpm --filter web-next dev', url: 'http://localhost:3000/payments', reuseExistingServer: true, timeout: 180_000 },
    { command: 'pnpm --filter web-angular dev', url: 'http://localhost:4200/payments', reuseExistingServer: true, timeout: 180_000 },
  ],
});
