/**
 * AdminUsersPage — Page Object for /admin/users
 *
 * Provides typed helpers for interacting with the admin user management UI.
 */

import { Page, Locator, expect } from '@playwright/test';

export class AdminUsersPage {
  readonly page: Page;
  readonly table: Locator;
  readonly searchInput: Locator;
  readonly createButton: Locator;
  /** The modal dialog that appears when creating or editing a user. */
  readonly userFormModal: Locator;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('table, [class*="t-table"], [class*="table"]').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="搜索"]').first();
    // Prefer "create" / "add" / "新增" buttons
    this.createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), ' +
      'button:has-text("新增"), button:has-text("创建用户")'
    ).first();
    this.userFormModal = page.locator(
      '[class*="t-dialog"], [class*="modal"], [role="dialog"]'
    ).first();
    this.emailField = this.userFormModal.locator('input[type="email"], input[name="email"]').first();
    this.passwordField = this.userFormModal.locator('input[type="password"]').first();
    this.saveButton = this.userFormModal.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("确认"), button:has-text("保存")'
    ).first();
  }

  async goto() {
    await this.page.goto('/admin/users', { waitUntil: 'networkidle' });
  }

  async expectTableVisible() {
    await expect(this.table).toBeVisible({ timeout: 10_000 });
  }

  /** Search for a user by email or username in the search box. */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    // Wait for the debounce / API response
    await this.page.waitForResponse('**/api/v1/admin/users**').catch(() => {});
  }

  /** Click the create user button and wait for the modal. */
  async openCreateModal() {
    await this.createButton.click();
    await expect(this.userFormModal).toBeVisible({ timeout: 5_000 });
  }

  /** Fill and submit the create user form. */
  async fillAndSubmitCreateForm(email: string, password: string) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.saveButton.click();
    // Wait for modal to close
    await expect(this.userFormModal).not.toBeVisible({ timeout: 10_000 });
  }

  /**
   * Find the table row that contains the given text (email, username, etc.)
   * and return it as a Locator.
   */
  rowWithText(text: string): Locator {
    return this.table.locator(`tr:has-text("${text}")`);
  }
}
