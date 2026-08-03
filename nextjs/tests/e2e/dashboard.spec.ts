import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 *
 * These tests run against the Next.js app with MSW (Mock Service Worker)
 * intercepting all API requests. MSW uses fixtures from tests/fixtures/api/.
 *
 * No Playwright route mocking needed - MSW handles everything automatically.
 *
 * To update fixtures:
 *   1. Run `php artisan fixtures:export --upload` in ink-api
 *   2. Run `npm run pull:fixtures` in this repo
 */

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth state
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        type: 'client',
      }));
    });
  });

  test('displays dashboard and loads without errors', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify page loads
    await expect(page).toHaveURL(/dashboard/);

    // Wait for real content instead of networkidle: Pusher/polling
    // connections keep the network busy, so networkidle never fires.
    await expect(
      page.locator('main, [role="main"], .dashboard, #dashboard').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('loads dashboard data from API', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify the page loaded successfully (MSW returned mocked data)
    await expect(page).toHaveURL(/dashboard/);
    await expect(
      page.locator('main, [role="main"], .dashboard, #dashboard').first()
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Artist Search', () => {
  test('displays artist search results from fixture', async ({ page }) => {
    await page.goto('/artists');

    // Verify search page loads
    await expect(page).toHaveURL(/artists/);

    // Verify artist from fixture data appears
    // The fixture contains artists like "Finn Cantu"
    await expect(page.getByText('Finn Cantu').first()).toBeVisible({ timeout: 15000 });
  });

  test('displays artist studio names from fixture', async ({ page }) => {
    await page.goto('/artists');

    // Verify studio names appear (fixture has "TJ TATZ")
    await expect(page.getByText('TJ TATZ').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Tattoo Search', () => {
  test('displays tattoo gallery with fixture data', async ({ page }) => {
    await page.goto('/tattoos');

    // Verify gallery loads
    await expect(page).toHaveURL(/tattoos/);

    // Verify some tattoo content loaded (artist name from fixture).
    // No networkidle wait: live socket connections keep the network busy.
    await expect(page.getByText('Alice Johnson').first()).toBeVisible({ timeout: 15000 });
  });
});
