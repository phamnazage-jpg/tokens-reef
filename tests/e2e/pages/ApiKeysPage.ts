/**
 * ApiKeysPage — Page Object for /keys (User API Key management)
 *
 * Provides typed helpers for interacting with the API Key management UI.
 */

import { Page, Locator, expect } from '@playwright/test';

export class ApiKeysPage {
  readonly page: Page;
  readonly table: Locator;
  readonly createButton: Locator;
  readonly createModal: Locator;
  readonly keyNameField: Locator;
  readonly saveButton: Locator;
  /** The revealed API key value (shown once after creation). */
  readonly revealedKeyValue: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('table, [class*="t-table"], [class*="table"]').first();
    this.createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), ' +
      'button:has-text("新建"), button:has-text("创建")'
    ).first();
    this.createModal = page.locator(
      '[class*="t-dialog"], [class*="modal"], [role="dialog"]'
    ).first();
    this.keyNameField = this.createModal.locator(
      'input[name="name"], input[placeholder*="name" i], input[placeholder*="名称"]'
    ).first();
    this.saveButton = this.createModal.locator(
      'button[type="submit"], button:has-text("Create"), button:has-text("确认"), button:has-text("保存")'
    ).first();
    // After creation the raw key is sometimes shown in a read-only input or code block
    this.revealedKeyValue = page.locator(
      '[class*="key-value"], [class*="api-key"] code, input[readonly][value^="sk-"]'
    ).first();
  }

  async goto() {
    await this.page.goto('/keys', { waitUntil: 'networkidle' });
  }

  async expectTableVisible() {
    await expect(this.table).toBeVisible({ timeout: 10_000 });
  }

  async openCreateModal() {
    await this.createButton.click();
    await expect(this.createModal).toBeVisible({ timeout: 5_000 });
  }

  async createKey(name: string) {
    await this.openCreateModal();
    await this.keyNameField.fill(name);
    await this.saveButton.click();
    // Wait for modal to close (key was created)
    await expect(this.createModal).not.toBeVisible({ timeout: 10_000 });
  }

  rowWithText(text: string): Locator {
    return this.table.locator(`tr:has-text("${text}")`);
  }

  /** Return the delete button within a specific table row. */
  deleteButtonInRow(rowText: string): Locator {
    return this.rowWithText(rowText).locator(
      'button:has-text("Delete"), button:has-text("删除"), [class*="delete"]'
    ).first();
  }
}
