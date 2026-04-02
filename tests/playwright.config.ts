import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Sub2API E2E Test Configuration
 *
 * Usage:
 *   npx playwright test                      # Run all tests (Chromium only by default)
 *   npx playwright test --headed             # Run with visible browser
 *   npx playwright test --debug              # Run in debug mode
 *   npx playwright test --project=chromium   # Run specific browser
 *   npx playwright test --project=firefox    # Run on Firefox
 *
 * Environment Variables:
 *   BASE_URL       - Base URL for tests (default: http://localhost:8080)
 *   TEST_EMAIL     - Admin test user email (default: lon22@qq.com)
 *   TEST_PASSWORD  - Admin test user password (default: admin123)
 *   CI             - Set to 'true' for CI environment
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

/** Path where global-setup saves the authenticated browser session. */
export const STORAGE_STATE = path.join(__dirname, 'e2e/.auth/user.json');

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only is accidentally left in source. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Action timeout (default 30 s is fine; tighten for local speed)
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* Configure projects for major browsers.
   *
   * The special "setup" project runs global-setup.ts first to authenticate
   * and persist the session to STORAGE_STATE.  All real test projects declare
   * it as a dependency so they start already logged in.
   *
   * NOTE: executablePath is intentionally NOT set here so Playwright uses its
   * own bundled browser binaries.  If you need a custom path, pass it via the
   * PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var or a .env file.
   */
  projects: [
    // ── Setup (authentication) ──────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Desktop browsers ────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },

    // ── Mobile / Tablet (Chromium-based) ────────────────────────────────────
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPad (Retina)',
      use: {
        ...devices['iPad (gen 7)'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],

  /* Verify that the backend is already running before tests start. */
  webServer: {
    command: 'echo "Backend should already be running at localhost:8080"',
    port: 8080,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  /* Global teardown only — setup is now a Playwright project, not globalSetup */
  globalTeardown: './e2e/setup/global-teardown.ts',
});
