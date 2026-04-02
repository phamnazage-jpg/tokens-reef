/**
 * global-setup.ts — Authentication Setup
 *
 * Runs as the "setup" Playwright project (see playwright.config.ts).
 * Logs in once, then saves the authenticated storage state to
 * e2e/.auth/user.json so every subsequent test project starts already
 * authenticated — no per-test login overhead.
 *
 * IMPORTANT: This file MUST export a default test function (not a plain
 * async function) so Playwright can run it as part of the "setup" project
 * without the old globalSetup hook.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const STORAGE_STATE = path.join(__dirname, '../.auth/user.json');

const TEST_EMAIL = process.env.TEST_EMAIL || 'lon22@qq.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

setup('authenticate as admin', async ({ page }) => {
  // ── 0. Ensure the .auth directory exists ─────────────────────────────────
  const authDir = path.dirname(STORAGE_STATE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // ── 1. Verify backend is reachable ───────────────────────────────────────
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(
    response && response.status() < 500,
    `Backend is not accessible at ${BASE_URL} (status ${response?.status()})`
  ).toBeTruthy();

  // ── 2. Navigate to login page ────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  // ── 3. Wait for the login form ───────────────────────────────────────────
  const emailInput = page.locator('#email, input[type="email"], input[name="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 20_000 });

  // ── 4. Fill credentials ───────────────────────────────────────────────────
  await emailInput.fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);

  // ── 5. Submit and wait for redirect ──────────────────────────────────────
  await Promise.all([
    page.waitForURL(/\/(admin\/)?dashboard/, { timeout: 20_000 }),
    page.locator('button[type="submit"]').click(),
  ]);

  // ── 6. Hard assert: we must be on a dashboard URL ────────────────────────
  await expect(page).toHaveURL(/\/(admin\/)?dashboard/, {
    timeout: 5_000,
  });

  // ── 7. Persist authenticated state ───────────────────────────────────────
  await page.context().storageState({ path: STORAGE_STATE });
  console.log(`✅ Auth state saved to ${STORAGE_STATE}`);
});
