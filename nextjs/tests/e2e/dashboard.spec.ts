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

  test('displays dashboard with suggested artists from fixture', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify page loads
    await expect(page).toHaveURL(/dashboard/);

    // Wait for API data to load and verify suggested artists appear
    // The fixture contains "Demetris Wilderman" and "Monica Heaney"
    await expect(page.getByText('Demetris Wilderman')).toBeVisible({ timeout: 15000 });
  });

  test('displays favorites from fixture data', async ({ page }) => {
    await page.goto('/dashboard');

    // The fixture contains favorites like "Jayme D'Amore IV"
    await expect(page.getByText("Jayme D'Amore IV").first()).toBeVisible({ timeout: 15000 });
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

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Verify some tattoo content loaded (artist name from fixture)
    await expect(page.getByText('Alice Johnson').first()).toBeVisible({ timeout: 15000 });
  });
});
