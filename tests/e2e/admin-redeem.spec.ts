import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'lon22@qq.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

/**
 * Redeem Code Module E2E Tests
 * 
 * Tests the redeem code functionality in admin panel.
 */
test.describe('Redeem Code Module', () => {
  
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('redeem code page loads', async ({ page }) => {
    await page.goto('/admin/redeem');
    await expect(page).toHaveURL(/\/redeem/);
  });

  test('redeem code content exists', async ({ page }) => {
    await page.goto('/admin/redeem');
    await page.waitForTimeout(1000);
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });
});
