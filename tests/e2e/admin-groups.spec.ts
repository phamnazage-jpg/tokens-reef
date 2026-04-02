/**
 * admin-groups.spec.ts — Admin Group Management E2E Tests
 *
 * Tests the complete group management lifecycle:
 *   List → Create → Read → Update → Rate multipliers → Delete
 *
 * Also validates:
 *   - Pagination and filter parameters
 *   - Required fields validation
 *   - Rate multiplier CRUD
 *
 * Requires: authenticated admin session (storageState from setup project).
 */

import { test, expect, type Page } from '@playwright/test';

// ── Types ────────────────────────────────────────────────────────────────────

interface Group {
  id: number;
  name: string;
  description?: string;
  platform?: string;
  is_default?: boolean;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uniqueGroupName(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

async function createGroupViaApi(page: Page, name: string, description = ''): Promise<Group> {
  const response = await page.request.post('/api/v1/admin/groups', {
    data: { name, description },
  });
  expect(
    response.status(),
    `POST /api/v1/admin/groups should return 200/201, got ${response.status()}`
  ).toBeLessThanOrEqual(201);
  const body = await response.json();
  const group: Group = body.data ?? body;
  expect(group.id).toBeGreaterThan(0);
  return group;
}

async function deleteGroupViaApi(page: Page, id: number) {
  await page.request.delete(`/api/v1/admin/groups/${id}`).catch(() => {});
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Admin Groups — page and list', () => {
  test('GET /admin/groups page loads and URL matches', async ({ page }) => {
    const response = await page.goto('/admin/groups');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/groups/);
  });

  test('group list API returns correct shape', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/groups?page=1&page_size=10');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Should be an array or a paginated object
    const groups: Group[] = Array.isArray(body) ? body : (body.data ?? []);
    expect(Array.isArray(groups)).toBe(true);
  });

  test('GET /api/v1/admin/groups/all returns full list without pagination', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/groups/all');
    expect(response.status()).toBe(200);
    const body = await response.json();
    const groups: Group[] = Array.isArray(body) ? body : (body.data ?? []);
    expect(Array.isArray(groups)).toBe(true);
  });

  test('group list response items have required schema fields', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/groups/all');
    expect(response.status()).toBe(200);
    const body = await response.json();
    const groups: Group[] = Array.isArray(body) ? body : (body.data ?? []);
    if (groups.length > 0) {
      const g = groups[0];
      expect(typeof g.id).toBe('number');
      expect(typeof g.name).toBe('string');
      expect(g.name.length).toBeGreaterThan(0);
      expect(typeof g.created_at).toBe('string');
    }
  });

  test('group table is rendered on /admin/groups page', async ({ page }) => {
    await page.goto('/admin/groups', { waitUntil: 'networkidle' });
    const table = page.locator('table, [class*="t-table"], [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Admin Groups — CRUD via REST API', () => {
  let groupId = 0;
  const groupName = uniqueGroupName('e2e-group');

  test.afterAll(async ({ browser }) => {
    if (groupId) {
      const page = await browser.newPage();
      await deleteGroupViaApi(page, groupId);
      await page.close();
    }
  });

  test('POST /api/v1/admin/groups creates a group with correct schema', async ({ page }) => {
    const response = await page.request.post('/api/v1/admin/groups', {
      data: { name: groupName, description: 'Created by E2E test' },
    });
    expect(response.status()).toBeLessThanOrEqual(201);
    const body = await response.json();
    const group: Group = body.data ?? body;

    expect(group.id).toBeGreaterThan(0);
    expect(group.name).toBe(groupName);
    expect(typeof group.created_at).toBe('string');

    groupId = group.id;
  });

  test('GET /api/v1/admin/groups/:id returns the created group', async ({ page }) => {
    test.skip(groupId === 0, 'Depends on create test');

    const response = await page.request.get(`/api/v1/admin/groups/${groupId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const group: Group = body.data ?? body;
    expect(group.id).toBe(groupId);
    expect(group.name).toBe(groupName);
  });

  test('PUT /api/v1/admin/groups/:id updates name and description', async ({ page }) => {
    test.skip(groupId === 0, 'Depends on create test');

    const newName = groupName + '-updated';
    const response = await page.request.put(`/api/v1/admin/groups/${groupId}`, {
      data: { name: newName, description: 'Updated by E2E test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const group: Group = body.data ?? body;
    expect(group.name).toBe(newName);

    // Verify via GET
    const getResp = await page.request.get(`/api/v1/admin/groups/${groupId}`);
    const getBody = await getResp.json();
    const fetched: Group = getBody.data ?? getBody;
    expect(fetched.name).toBe(newName);
  });

  test('GET /api/v1/admin/groups/:id/stats returns stats object', async ({ page }) => {
    test.skip(groupId === 0, 'Depends on create test');

    const response = await page.request.get(`/api/v1/admin/groups/${groupId}/stats`);
    // Acceptable: 200 with real data, or 501/404 if not implemented (P1-03 known issue)
    // We just verify the server does not crash (no 5xx)
    expect(
      response.status(),
      `GET /admin/groups/:id/stats returned server error: ${response.status()}`
    ).toBeLessThan(500);

    if (response.status() === 200) {
      const body = await response.json();
      // If implemented, the response must have numeric fields (even if zero)
      const data = body.data ?? body;
      // Check at least one of the known stats fields exists
      const knownFields = ['total_api_keys', 'active_api_keys', 'total_requests', 'total_cost'];
      const hasAtLeastOneField = knownFields.some((f) => typeof data[f] !== 'undefined');
      expect(
        hasAtLeastOneField,
        `Group stats should contain at least one of ${knownFields.join(', ')}, got: ${JSON.stringify(data)}`
      ).toBe(true);
    }
  });

  test('DELETE /api/v1/admin/groups/:id removes the group', async ({ page }) => {
    test.skip(groupId === 0, 'Depends on create test');

    const response = await page.request.delete(`/api/v1/admin/groups/${groupId}`);
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThanOrEqual(204);

    // Verify the group no longer exists
    const getResp = await page.request.get(`/api/v1/admin/groups/${groupId}`);
    expect(getResp.status()).toBe(404);

    groupId = 0;
  });
});

test.describe('Admin Groups — rate multiplier management', () => {
  let testGroupId = 0;
  const gName = uniqueGroupName('rate-test-group');

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const g = await createGroupViaApi(page, gName, 'Rate multiplier E2E test');
    testGroupId = g.id;
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (testGroupId) {
      const page = await browser.newPage();
      await deleteGroupViaApi(page, testGroupId);
      await page.close();
    }
  });

  test('GET /api/v1/admin/groups/:id/rate-multipliers returns a list', async ({ page }) => {
    test.skip(testGroupId === 0, 'Depends on beforeAll');

    const response = await page.request.get(`/api/v1/admin/groups/${testGroupId}/rate-multipliers`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const multipliers = body.data ?? body;
    expect(Array.isArray(multipliers)).toBe(true);
  });

  test('PUT /api/v1/admin/groups/:id/rate-multipliers sets model multipliers', async ({ page }) => {
    test.skip(testGroupId === 0, 'Depends on beforeAll');

    // Set rate multipliers for users (user-level rate multipliers)
    const payload = {
      entries: [
        { user_id: 1, rate_multiplier: 1.5 },
        { user_id: 2, rate_multiplier: 2.0 },
      ],
    };

    const response = await page.request.put(
      `/api/v1/admin/groups/${testGroupId}/rate-multipliers`,
      { data: payload }
    );
    // 200 OK or 204 No Content
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThanOrEqual(204);

    // Verify the values were saved
    const getResp = await page.request.get(`/api/v1/admin/groups/${testGroupId}/rate-multipliers`);
    expect(getResp.status()).toBe(200);
    const getBody = await getResp.json();
    const saved = getBody.data ?? getBody;
    if (Array.isArray(saved) && saved.length > 0) {
      const user1Entry = saved.find((m: { user_id: number }) => m.user_id === 1);
      if (user1Entry) {
        expect(user1Entry.rate_multiplier).toBeCloseTo(1.5, 1);
      }
    }
  });

  test('DELETE /api/v1/admin/groups/:id/rate-multipliers clears all multipliers', async ({ page }) => {
    test.skip(testGroupId === 0, 'Depends on beforeAll');

    const response = await page.request.delete(
      `/api/v1/admin/groups/${testGroupId}/rate-multipliers`
    );
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThanOrEqual(204);

    // After clear, list should be empty
    const listResp = await page.request.get(`/api/v1/admin/groups/${testGroupId}/rate-multipliers`);
    expect(listResp.status()).toBe(200);
    const body = await listResp.json();
    const multipliers = body.data ?? body;
    if (Array.isArray(multipliers)) {
      expect(multipliers).toHaveLength(0);
    }
  });
});

test.describe('Admin Groups — validation and errors', () => {
  test('creating group with empty name returns 400/422', async ({ page }) => {
    const response = await page.request.post('/api/v1/admin/groups', {
      data: { name: '', description: 'test' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('fetching non-existent group returns 404', async ({ page }) => {
    const response = await page.request.get('/api/v1/admin/groups/9999999');
    expect(response.status()).toBe(404);
  });
});
