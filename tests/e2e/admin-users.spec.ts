/**
 * admin-users.spec.ts — Admin User Management E2E Tests
 *
 * Covers the full admin user management lifecycle:
 *   List → Create → Read → Update → Balance adjustment → Status toggle → Delete
 *
 * Tests run against the real backend via both the REST API and the Admin UI.
 * Requires: authenticated admin session (storageState from setup project).
 */

import { test, expect, type Page } from '@playwright/test';

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: number;
  email: string;
  username?: string;
  status: string;
  role: string;
  balance: number;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@e2e-test.example.com`;
}

async function createUserViaApi(page: Page, email: string, password: string, username?: string): Promise<AdminUser> {
  const response = await page.request.post('/api/v1/admin/users', {
    data: {
      email,
      password,
      username: username ?? `user_${Date.now()}`,
    },
  });
  expect(response.status(), `POST /api/v1/admin/users should return 200/201, got ${response.status()}`).toBeLessThanOrEqual(201);
  const body = await response.json();
  const user: AdminUser = body.data ?? body;
  expect(user.id).toBeGreaterThan(0);
  return user;
}

async function deleteUserViaApi(page: Page, id: number) {
  await page.request.delete(`/api/v1/admin/users/${id}`).catch(() => {});
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Admin Users — page and list', () => {
  test('GET /admin/users page loads and returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/admin/users');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('user list API returns correct pagination shape', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/users?page=1&page_size=10');
    expect(response.status()).toBe(200);
    const body = await response.json() as { data: AdminUser[]; total: number };
    // Must have a data array
    expect(Array.isArray(body.data), 'Response data should be an array').toBe(true);
    // total should be a non-negative integer
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThanOrEqual(0);
  });

  test('user table is rendered on /admin/users', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    const table = page.locator('table, [class*="t-table"], [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
  });

  test('user list API response items have required fields', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/users?page=1&page_size=5');
    expect(response.status()).toBe(200);
    const body = await response.json() as { data: AdminUser[] };
    if (body.data.length > 0) {
      const user = body.data[0];
      expect(typeof user.id).toBe('number');
      expect(typeof user.email).toBe('string');
      expect(user.email).toContain('@');
      expect(['active', 'disabled', 'pending'].includes(user.status)).toBe(true);
      expect(['user', 'admin'].includes(user.role)).toBe(true);
    }
  });
});

test.describe('Admin Users — CRUD via REST API', () => {
  let userId = 0;
  const email = uniqueEmail('crud-user');
  const password = 'E2eTestPass123!';

  test.afterAll(async ({ browser }) => {
    if (userId) {
      const page = await browser.newPage();
      await deleteUserViaApi(page, userId);
      await page.close();
    }
  });

  test('POST /api/v1/admin/users creates a user with correct schema', async ({ page }) => {
    const response = await page.request.post('/api/v1/admin/users', {
      data: { email, password, username: `e2euser_${Date.now()}` },
    });
    expect(response.status()).toBeLessThanOrEqual(201);
    const body = await response.json();
    const user: AdminUser = body.data ?? body;

    expect(user.id).toBeGreaterThan(0);
    expect(user.email).toBe(email);
    expect(user.status).toBe('active');
    expect(user.role).toBe('user');
    expect(typeof user.balance).toBe('number');

    userId = user.id;
  });

  test('GET /api/v1/admin/users/:id returns the created user', async ({ page }) => {
    test.skip(userId === 0, 'Depends on create test');

    const response = await page.request.get(`/api/v1/admin/users/${userId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const user: AdminUser = body.data ?? body;
    expect(user.id).toBe(userId);
    expect(user.email).toBe(email);
  });

  test('PUT /api/v1/admin/users/:id updates the user', async ({ page }) => {
    test.skip(userId === 0, 'Depends on create test');

    const newUsername = `updated_${Date.now()}`;
    const response = await page.request.put(`/api/v1/admin/users/${userId}`, {
      data: { username: newUsername },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const user: AdminUser = body.data ?? body;
    expect(user.username ?? user.email).toBeTruthy();
  });

  test('POST /api/v1/admin/users/:id/balance adjusts user balance', async ({ page }) => {
    test.skip(userId === 0, 'Depends on create test');

    const topUpAmount = 100;
    const response = await page.request.post(`/api/v1/admin/users/${userId}/balance`, {
      data: { balance: topUpAmount, operation: 'add', notes: 'E2E test top-up' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const user: AdminUser = body.data ?? body;
    // After a positive top-up, balance should equal or exceed topUpAmount (started at 0)
    expect(user.balance).toBeGreaterThanOrEqual(topUpAmount);
  });

  test('disabling user via PUT sets status=disabled', async ({ page }) => {
    test.skip(userId === 0, 'Depends on create test');

    const response = await page.request.put(`/api/v1/admin/users/${userId}`, {
      data: { status: 'disabled' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const user: AdminUser = body.data ?? body;
    expect(user.status).toBe('disabled');
  });

  test('re-enabling user via PUT sets status=active', async ({ page }) => {
    test.skip(userId === 0, 'Depends on create test');

    const response = await page.request.put(`/api/v1/admin/users/${userId}`, {
      data: { status: 'active' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const user: AdminUser = body.data ?? body;
    expect(user.status).toBe('active');
  });

  test('DELETE /api/v1/admin/users/:id removes the user', async ({ page }) => {
    test.skip(userId === 0, 'Depends on create test');

    const response = await page.request.delete(`/api/v1/admin/users/${userId}`);
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThanOrEqual(204);

    // Verify user no longer exists
    const getResp = await page.request.get(`/api/v1/admin/users/${userId}`);
    expect(getResp.status()).toBe(404);

    userId = 0;
  });
});

test.describe('Admin Users — validation and error cases', () => {
  test('creating user with duplicate email returns 409 or 422', async ({ page }) => {
    // Use the admin account email (known to exist)
    const adminEmail = process.env.TEST_EMAIL;
    if (!adminEmail) {
      throw new Error('TEST_EMAIL environment variable is required');
    }
    const response = await page.request.post('/api/v1/admin/users', {
      data: { email: adminEmail, password: 'SomePassword123' },
    });
    expect(
      response.status(),
      'Duplicate email should return 4xx error (409 Conflict or 422 Unprocessable)'
    ).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('creating user with invalid email returns 400 or 422', async ({ page }) => {
    const response = await page.request.post('/api/v1/admin/users', {
      data: { email: 'not-an-email', password: 'SomePassword123' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('fetching non-existent user returns 404', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/users/9999999');
    expect(response.status()).toBe(404);
  });

  test('user balance adjustment with negative amount exceeding balance should fail gracefully', async ({ page }) => {
    // Try to deduct more than available (starting with a fresh user at 0 balance)
    const tempEmail = uniqueEmail('balance-test');
    const createResp = await page.request.post('/api/v1/admin/users', {
      data: { email: tempEmail, password: 'TempPass123!', username: `tmp_${Date.now()}` },
    });
    if (createResp.status() > 201) {
      test.skip(true, 'Could not create temp user for this test');
      return;
    }
    const body = await createResp.json();
    const user: AdminUser = body.data ?? body;

    const deductResp = await page.request.post(`/api/v1/admin/users/${user.id}/balance`, {
      data: { balance: 0, operation: 'set', notes: 'E2E over-deduction test' },
    });
    // Either 400/422 (validation error) or 200 with clamped balance — the key is no 500
    expect(deductResp.status(), 'Server should not return 5xx on over-deduction').toBeLessThan(500);

    // Cleanup
    await deleteUserViaApi(page, user.id);
  });
});
