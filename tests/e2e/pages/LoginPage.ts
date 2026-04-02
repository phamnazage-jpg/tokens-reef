/**
 * LoginPage — Page Object for the login screen
 *
 * Improvements over the original:
 *  - Removed waitForTimeout anti-pattern; navigation is awaited properly.
 *  - More specific locator for error messages.
 *  - Added helper to verify the current user is actually logged in.
 *  - Added `loginAndWaitForDashboard` for tests that need full authentication.
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  /** Error/notification messages shown after a failed login attempt. */
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Prefer the #email id; fall back to generic selectors
    this.emailInput = page.locator('#email, input[type="email"], input[name="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.submitButton = page.locator('button[type="submit"]').first();
    // TDesign toast / notification classes, or generic alert
    this.errorMessage = page.locator(
      '[class*="t-message"], [class*="t-notification"], [class*="t-alert"], ' +
      '[class*="error"], [class*="alert"], [role="alert"]'
    ).first();
  }

  async goto() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
  }

  /**
   * Fill and submit the login form.
   * Does NOT wait for navigation — callers decide what to assert next.
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Login and block until the dashboard URL is reached.
   * Use this in beforeEach hooks that just need an authenticated session.
   */
  async loginAndWaitForDashboard(email: string, password: string) {
    await this.goto();
    await Promise.all([
      this.page.waitForURL(/\/(admin\/)?dashboard/, { timeout: 20_000 }),
      this.login(email, password),
    ]);
  }

  /** Assert the user has been navigated away from /login (i.e. logged in). */
  async expectToBeLoggedIn() {
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  }

  /** Assert that an error message is visible on the login page. */
  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible({ timeout: 8_000 });
  }
}
