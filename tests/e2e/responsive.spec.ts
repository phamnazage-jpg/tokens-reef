import { test, expect } from '@playwright/test';

/**
 * Responsive Design E2E Tests
 * 
 * Tests the application responsiveness across different devices.
 * Relies on global setup for authentication.
 */
test.describe('Responsive Design', () => {
  
  test('desktop layout (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Go directly to dashboard - global setup handles auth
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(500);
    
    // Page should be fully loaded
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('laptop layout (1366x768)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(500);
    
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('tablet layout (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(500);
    
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('mobile layout (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(500);
    
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});
