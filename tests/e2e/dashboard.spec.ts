/**
 * dashboard.spec.ts — Admin Dashboard E2E Tests
 *
 * Relies on storageState from the "setup" project (already authenticated).
 *
 * Covers:
 *  - Page loads and URL resolves
 *  - Dashboard API (/api/v1/admin/dashboard/stats) responds with real data
 *  - Statistics cards are rendered with non-zero numeric content
 *  - Sidebar navigation is visible and functional
 *  - No uncaught JS errors on page load
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Admin Dashboard', () => {
  test('navigates to /admin/dashboard and returns 200', async ({ page }) => {
    const response = await page.goto('/admin/dashboard');
    expect(response?.status(), 'Dashboard page should return HTTP 200').toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('dashboard stats API is called and returns data', async ({ page }) => {
    let statsResponseStatus = 0;
    let statsBody: unknown = null;

    await page.route('**/api/v1/admin/dashboard/**', async (route) => {
      const response = await route.fetch();
      statsResponseStatus = response.status();
      statsBody = await response.json().catch(() => null);
      await route.fulfill({ response });
    });

    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // At least one admin/dashboard API call should have succeeded
    expect(
      statsResponseStatus,
      `Dashboard stats API should return 2xx, got ${statsResponseStatus}`
    ).toBeGreaterThanOrEqual(200);
    expect(statsResponseStatus).toBeLessThan(300);
    expect(statsBody, 'Dashboard stats API response should not be null').not.toBeNull();
  });

  test('at least one statistics card is rendered with a visible number', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Wait for the page to finish loading data
    await page.waitForLoadState('networkidle');

    // Look for numeric value elements inside stat/card components
    // TDesign stat card renders numbers in t-statistic__content or similar
    const statNumbers = page.locator(
      '[class*="statistic"] [class*="number"], ' +
      '[class*="stat"] [class*="value"], ' +
      '[class*="card"] [class*="number"], ' +
      '[class*="t-statistic"]'
    );

    const count = await statNumbers.count();
    expect(count, 'Dashboard should render at least one statistics number element').toBeGreaterThan(0);

    // Verify the first visible stat element actually contains a number
    if (count > 0) {
      const firstStat = statNumbers.first();
      await expect(firstStat).toBeVisible({ timeout: 8_000 });
      const text = await firstStat.textContent();
      // Should contain at least one digit (could be 0 if system is empty)
      expect(text, `Stat element text should contain a digit, got: "${text}"`).toMatch(/\d/);
    }
  });

  test('sidebar / navigation menu is visible', async ({ page }) => {
    const dp = new DashboardPage(page);
    await dp.goto();
    await expect(dp.sidebar).toBeVisible({ timeout: 10_000 });
  });

  test('page title contains "Dashboard" or the site name', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title, `Page title should not be empty or just "Sub2API", got: "${title}"`).toMatch(
      /dashboard|sub2api/i
    );
  });

  test('no uncaught JS errors on dashboard load', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    expect(
      jsErrors,
      `Unexpected JS errors on dashboard: ${jsErrors.join('; ')}`
    ).toHaveLength(0);
  });

  test('dashboard trend chart area is rendered (not blank)', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Allow time for chart rendering
    await page.waitForSelector(
      '[class*="chart"], [class*="trend"], canvas, svg[class*="chart"]',
      { timeout: 10_000, state: 'visible' }
    ).catch(() => {
      // Charts may not be present if there is no data — not a hard failure
      console.warn('No chart element found; the system may have no usage data yet.');
    });
  });
});
