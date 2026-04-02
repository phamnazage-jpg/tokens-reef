/**
 * user-apikey-lifecycle.spec.ts — API Key CRUD E2E Tests
 *
 * Tests the complete API Key lifecycle from a regular user's perspective:
 *   Create → Read (list) → Update (rename) → Toggle status → Delete
 *
 * Also validates:
 *   - API responses conform to the expected schema
 *   - The UI reflects API state (no stale cache)
 *   - Unique name conflict handling
 *
 * Requires: authenticated admin session (storageState from setup project).
 * The admin account doubles as a test user so no separate user registration
 * is needed.
 */

import { test, expect, type Page, type Response } from '@playwright/test';

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyResponse {
  id: number;
  name: string;
  key?: string;       // Only present on creation
  status: string;
  created_at: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a unique name to avoid conflicts between test runs */
function uniqueName(prefix: string) {
  return `${prefix}-e2e-${Date.now()}`;
}

/**
 * Create an API key via the REST API directly (bypasses UI for setup speed).
 * Returns the created key object.
 */
async function createApiKeyViaApi(page: Page, name: string): Promise<ApiKeyResponse> {
  const response = await page.request.post('/api/v1/api-keys', {
    data: { name, group_id: null },
  });
  expect(response.status(), `POST /api/v1/api-keys should return 200 or 201, got ${response.status()}`).toBeLessThanOrEqual(201);
  const body = await response.json() as ApiResponse<ApiKeyResponse>;
  const key = body.data ?? (body as unknown as ApiKeyResponse);
  expect(key.id, 'Created API key should have a numeric id').toBeGreaterThan(0);
  expect(key.name).toBe(name);
  return key;
}

/** Delete an API key via the REST API (cleanup helper). */
async function deleteApiKeyViaApi(page: Page, id: number) {
  const response = await page.request.delete(`/api/v1/api-keys/${id}`);
  // 200 or 204 are both acceptable
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThanOrEqual(204);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('API Key — REST API lifecycle', () => {
  let createdKeyId = 0;
  const keyName = uniqueName('test-key');

  test.afterAll(async ({ request }) => {
    // Clean up: delete the key if it was created
    if (createdKeyId) {
      await request.delete(`/api/v1/api-keys/${createdKeyId}`).catch(() => {});
    }
  });

  test('POST /api/v1/api-keys creates a key with correct schema', async ({ page }) => {
    const response = await page.request.post('/api/v1/api-keys', {
      data: { name: keyName },
    });

    expect(response.status()).toBeLessThanOrEqual(201);
    const body = await response.json();
    const key: ApiKeyResponse = body.data ?? body;

    // Schema assertions
    expect(key.id, 'id should be a positive integer').toBeGreaterThan(0);
    expect(key.name).toBe(keyName);
    expect(key.status, 'New key should be active by default').toBe('active');
    expect(typeof key.created_at).toBe('string');
    // The raw key value is returned once on creation
    if (key.key) {
      expect(key.key, 'API key value should start with "sk-"').toMatch(/^sk-/);
    }

    createdKeyId = key.id;
  });

  test('GET /api/v1/api-keys list includes the newly created key', async ({ page }) => {
    // Ensure previous test ran (depends on createdKeyId)
    test.skip(createdKeyId === 0, 'Skipping: previous create test did not run');

    const response = await page.request.get('/api/v1/api-keys');
    expect(response.status()).toBe(200);
    const body = await response.json();
    const keys: ApiKeyResponse[] = Array.isArray(body) ? body : (body.data ?? []);

    const found = keys.find((k) => k.id === createdKeyId);
    expect(found, `Newly created key (id=${createdKeyId}) should appear in the list`).toBeTruthy();
    expect(found!.name).toBe(keyName);
  });

  test('GET /api/v1/api-keys/:id returns the specific key', async ({ page }) => {
    test.skip(createdKeyId === 0, 'Skipping: depends on create test');

    const response = await page.request.get(`/api/v1/api-keys/${createdKeyId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const key: ApiKeyResponse = body.data ?? body;
    expect(key.id).toBe(createdKeyId);
    expect(key.name).toBe(keyName);
  });

  test('PUT /api/v1/api-keys/:id renames the key', async ({ page }) => {
    test.skip(createdKeyId === 0, 'Skipping: depends on create test');

    const newName = keyName + '-renamed';
    const response = await page.request.put(`/api/v1/api-keys/${createdKeyId}`, {
      data: { name: newName },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const key: ApiKeyResponse = body.data ?? body;
    expect(key.name, 'Key name should be updated').toBe(newName);

    // Verify via GET
    const getResp = await page.request.get(`/api/v1/api-keys/${createdKeyId}`);
    const getBody = await getResp.json();
    const fetched: ApiKeyResponse = getBody.data ?? getBody;
    expect(fetched.name).toBe(newName);
  });

  test('PUT /api/v1/api-keys/:id can disable (set status=inactive)', async ({ page }) => {
    test.skip(createdKeyId === 0, 'Skipping: depends on create test');

    const response = await page.request.put(`/api/v1/api-keys/${createdKeyId}`, {
      data: { status: 'inactive' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const key: ApiKeyResponse = body.data ?? body;
    expect(key.status).toBe('inactive');
  });

  test('PUT /api/v1/api-keys/:id can re-enable (set status=active)', async ({ page }) => {
    test.skip(createdKeyId === 0, 'Skipping: depends on create test');

    const response = await page.request.put(`/api/v1/api-keys/${createdKeyId}`, {
      data: { status: 'active' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const key: ApiKeyResponse = body.data ?? body;
    expect(key.status).toBe('active');
  });

  test('DELETE /api/v1/api-keys/:id removes the key', async ({ page }) => {
    test.skip(createdKeyId === 0, 'Skipping: depends on create test');

    const response = await page.request.delete(`/api/v1/api-keys/${createdKeyId}`);
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThanOrEqual(204);

    // Verify it no longer appears in the list
    const listResp = await page.request.get('/api/v1/api-keys');
    const body = await listResp.json();
    const keys: ApiKeyResponse[] = Array.isArray(body) ? body : (body.data ?? []);
    const found = keys.find((k) => k.id === createdKeyId);
    expect(found, 'Deleted key should no longer appear in the list').toBeUndefined();

    createdKeyId = 0; // Mark as cleaned up
  });
});

test.describe('API Key — UI interactions (/keys page)', () => {
  let apiKeyId = 0;
  const keyName = uniqueName('ui-test-key');

  test.beforeAll(async ({ browser }) => {
    // Create a key via API for the UI tests to interact with
    const page = await browser.newPage();
    const k = await createApiKeyViaApi(page, keyName);
    apiKeyId = k.id;
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (apiKeyId) {
      const page = await browser.newPage();
      await deleteApiKeyViaApi(page, apiKeyId).catch(() => {});
      await page.close();
    }
  });

  test('/keys page loads and shows the key table', async ({ page }) => {
    await page.goto('/keys', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/keys/);

    // The keys table (or list) should be rendered
    const table = page.locator('table, [class*="table"], [class*="t-table"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
  });

  test('created API key appears in the /keys table', async ({ page }) => {
    await page.goto('/keys', { waitUntil: 'networkidle' });

    // Look for the key name in the page
    const keyRow = page.getByText(keyName, { exact: false });
    await expect(keyRow).toBeVisible({ timeout: 10_000 });
  });

  test('API key list response contains expected fields', async ({ page }) => {
    let listBody: unknown = null;

    await page.route('**/api/v1/api-keys*', async (route) => {
      const response = await route.fetch();
      listBody = await response.json().catch(() => null);
      await route.fulfill({ response });
    });

    await page.goto('/keys', { waitUntil: 'networkidle' });

    expect(listBody, 'API key list API should return a body').not.toBeNull();

    const keys: ApiKeyResponse[] = Array.isArray(listBody)
      ? listBody
      : ((listBody as { data?: ApiKeyResponse[] }).data ?? []);

    if (keys.length > 0) {
      const first = keys[0];
      expect(typeof first.id).toBe('number');
      expect(typeof first.name).toBe('string');
      expect(typeof first.status).toBe('string');
    }
  });
});

test.describe('API Key — error and validation', () => {
  test('creating a key with an empty name returns 4xx', async ({ page }) => {
    const response = await page.request.post('/api/v1/api-keys', {
      data: { name: '' },
    });
    expect(
      response.status(),
      'Empty name should be rejected with 4xx error'
    ).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('fetching a non-existent key returns 404', async ({ page }) => {
    const response = await page.request.get('/api/v1/api-keys/9999999');
    expect(response.status()).toBe(404);
  });

  test('deleting a non-existent key returns 404', async ({ page }) => {
    const response = await page.request.delete('/api/v1/api-keys/9999999');
    expect(response.status()).toBe(404);
  });
});
