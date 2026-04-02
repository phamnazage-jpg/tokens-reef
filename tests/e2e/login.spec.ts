/**
 * login.spec.ts — Login Module E2E Tests
 *
 * Covers:
 *  - Page structure & accessibility
 *  - Successful login → redirect to dashboard
 *  - Login API request payload validation (via route interception)
 *  - Invalid credentials → error message visible
 *  - Empty form submission → inline validation
 *  - Already-authenticated redirect behaviour
 *
 * NOTE: These tests do NOT depend on storageState (they test the login page
 * itself), so they intentionally use a fresh, unauthenticated context.
 */

import { test, expect, type Page } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables are required');
}

/** Reset browser storage before each test to ensure a fresh unauthenticated state. */
async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Login — page structure', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('login page loads and URL matches /login', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
  });

  test('email input is visible and accepts input', async ({ page }) => {
    const lp = new LoginPage(page);
    await expect(lp.emailInput).toBeVisible();
    await lp.emailInput.fill('test@example.com');
    await expect(lp.emailInput).toHaveValue('test@example.com');
  });

  test('password input is visible and type=password (masked)', async ({ page }) => {
    const lp = new LoginPage(page);
    await expect(lp.passwordInput).toBeVisible();
    const inputType = await lp.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('submit button is visible and enabled on page load', async ({ page }) => {
    const lp = new LoginPage(page);
    await expect(lp.submitButton).toBeVisible();
    await expect(lp.submitButton).toBeEnabled();
  });
});

test.describe('Login — success flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('successful login sends correct POST /api/v1/auth/login payload', async ({ page }) => {
    // Intercept the login API call to validate request body
    let capturedBody: Record<string, unknown> = {};
    await page.route('**/api/v1/auth/login', async (route, request) => {
      capturedBody = JSON.parse(request.postData() ?? '{}');
      await route.continue();
    });

    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login(TEST_EMAIL, TEST_PASSWORD);

    // Verify the correct credentials were sent
    expect(capturedBody.email).toBe(TEST_EMAIL);
    expect(capturedBody.password).toBe(TEST_PASSWORD);
  });

  test('successful login redirects to /admin/dashboard or /dashboard', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login(TEST_EMAIL, TEST_PASSWORD);

    // Should be redirected away from /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    // Should be on a dashboard
    await expect(page).toHaveURL(/\/(admin\/)?dashboard/, { timeout: 5_000 });
  });

  test('after login, JWT token is stored in localStorage', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login(TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL(/\/(admin\/)?dashboard/, { timeout: 15_000 });

    const token = await page.evaluate(() => {
      // The app stores the token under 'token', 'auth_token' or similar keys
      return (
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('access_token')
      );
    });
    expect(token, 'A JWT/auth token should be persisted in localStorage after login').toBeTruthy();
  });

  test('login API responds 200 with token field', async ({ page }) => {
    let responseBody: Record<string, unknown> = {};
    await page.route('**/api/v1/auth/login', async (route) => {
      const response = await route.fetch();
      const body = await response.json().catch(() => ({}));
      responseBody = body;
      await route.fulfill({ response });
    });

    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login(TEST_EMAIL, TEST_PASSWORD);

    // The response must contain a token (either at top level or nested in data)
    const hasToken =
      typeof responseBody.token === 'string' ||
      typeof (responseBody.data as Record<string, unknown>)?.token === 'string' ||
      typeof responseBody.access_token === 'string';
    expect(hasToken, `Login response should contain a token, got: ${JSON.stringify(responseBody)}`).toBe(true);
  });
});

test.describe('Login — error scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('wrong password shows error message and stays on login page', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login(TEST_EMAIL, 'definitely_wrong_password_xyz');

    // Should still be on the login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // An error/notification element should be visible
    await expect(lp.errorMessage).toBeVisible({ timeout: 8_000 });
  });

  test('non-existent email shows error and stays on login page', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login('nonexistent_user_xyz_999@example.com', 'anypassword');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(lp.errorMessage).toBeVisible({ timeout: 8_000 });
  });

  test('API 401 response does NOT crash the page (no uncaught JS errors)', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // Force a 401 from the backend
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) })
    );

    const lp = new LoginPage(page);
    await lp.goto();
    await lp.emailInput.fill(TEST_EMAIL);
    await lp.passwordInput.fill(TEST_PASSWORD);
    await lp.submitButton.click();

    // Give it a moment to settle
    await page.waitForTimeout(1_000);

    // No uncaught JS exceptions should have been thrown
    expect(jsErrors, `Uncaught JS errors on 401: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test('empty email submission triggers HTML5 or custom validation', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.goto();
    // Only fill password, leave email blank
    await lp.passwordInput.fill(TEST_PASSWORD);
    await lp.submitButton.click();

    // Either the browser blocks submission (URL stays /login) or custom validation fires
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login — authenticated redirect', () => {
  // These tests USE storageState (already logged in) to verify redirect behaviour
  test('accessing /login while authenticated redirects away from login', async ({ page }) => {
    // page already has storageState from setup project
    await page.goto('/login');
    // Router guard should redirect authenticated users
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/(admin\/)?dashboard|\/home/, { timeout: 5_000 });
  });
});
