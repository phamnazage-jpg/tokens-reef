/**
 * DashboardPage — Page Object for the Admin Dashboard (/admin/dashboard)
 *
 * Improvements:
 *  - Removed waitForTimeout anti-pattern; use proper waits.
 *  - More specific locators for sidebar and stat cards.
 */

import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly sidebar: Locator;
  /** Statistics / metric cards on the dashboard */
  readonly statCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1, h2, [class*="title"], [class*="t-page-header__title"]').first();
    this.sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="t-menu"], [class*="t-layout__sider"]').first();
    this.statCards = page.locator('[class*="t-statistic"], [class*="statistic"], [class*="stat-card"]');
  }

  async goto() {
    await this.page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
  }

  async expectSidebarVisible() {
    await expect(this.sidebar).toBeVisible({ timeout: 10_000 });
  }

  async navigateTo(section: string) {
    const link = this.sidebar.locator(`a:has-text("${section}")`);
    await link.click();
    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle');
  }

  async expectAtLeastOneStatCard() {
    const count = await this.statCards.count();
    expect(count, 'Dashboard should have at least one stat card').toBeGreaterThan(0);
  }
}
