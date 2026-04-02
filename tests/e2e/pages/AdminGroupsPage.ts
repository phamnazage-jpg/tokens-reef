/**
 * AdminGroupsPage — Page Object for /admin/groups
 *
 * Provides typed helpers for interacting with the admin group management UI.
 */

import { Page, Locator, expect } from '@playwright/test';

export class AdminGroupsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly createButton: Locator;
  readonly groupFormModal: Locator;
  readonly nameField: Locator;
  readonly descriptionField: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('table, [class*="t-table"], [class*="table"]').first();
    this.createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), ' +
      'button:has-text("新增"), button:has-text("创建分组")'
    ).first();
    this.groupFormModal = page.locator(
      '[class*="t-dialog"], [class*="modal"], [role="dialog"]'
    ).first();
    this.nameField = this.groupFormModal.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="名称"]').first();
    this.descriptionField = this.groupFormModal.locator(
      'textarea, input[name="description"], input[placeholder*="description" i], input[placeholder*="描述"]'
    ).first();
    this.saveButton = this.groupFormModal.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("确认"), button:has-text("保存")'
    ).first();
  }

  async goto() {
    await this.page.goto('/admin/groups', { waitUntil: 'networkidle' });
  }

  async expectTableVisible() {
    await expect(this.table).toBeVisible({ timeout: 10_000 });
  }

  async openCreateModal() {
    await this.createButton.click();
    await expect(this.groupFormModal).toBeVisible({ timeout: 5_000 });
  }

  async fillAndSubmitCreateForm(name: string, description = '') {
    await this.nameField.fill(name);
    if (description) {
      await this.descriptionField.fill(description);
    }
    await this.saveButton.click();
    await expect(this.groupFormModal).not.toBeVisible({ timeout: 10_000 });
  }

  rowWithText(text: string): Locator {
    return this.table.locator(`tr:has-text("${text}")`);
  }
}
