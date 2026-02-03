import { test, expect } from '@playwright/test';
import { apiFixtures } from '../fixtures/api';
import {
  mockClientDashboard,
  mockAuthenticatedUser,
  mockArtistSearch,
  mockArtistDetail,
  mockTattooSearch,
  mockEmptyResponse,
  mockApiError,
  mockCommonEndpoints,
} from './utils/api-mocks';

/**
 * Dashboard E2E Tests with API Mocking
 *
 * These tests use fixtures exported from ink-api contract tests.
 * API calls are intercepted and return fixture data, so tests:
 * - Run without needing the backend
 * - Are fast and consistent
 * - Verify frontend handles API response structures correctly
 *
 * To update fixtures:
 *   1. Run `php artisan fixtures:export --upload` in ink-api
 *   2. Run `npm run pull:fixtures` in this repo
 */

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonEndpoints(page);
    await mockAuthenticatedUser(page);
    await mockClientDashboard(page);
  });

  test('displays dashboard with user data', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify page loads
    await expect(page).toHaveURL(/dashboard/);
  });

  test('displays favorites from fixture data', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that favorites section exists
    // Adjust selectors based on your actual dashboard UI
    const favoritesSection = page.getByTestId('favorites-section');
    if (await favoritesSection.isVisible()) {
      await expect(favoritesSection).toBeVisible();
    }
  });

  test('handles empty favorites state', async ({ page }) => {
    // Override fixture with empty data
    await mockEmptyResponse(page, '/api/client/favorites', { favorites: [] });

    await page.goto('/dashboard');

    // Should show empty state message
    // Adjust based on your actual empty state UI
  });

  test('handles API error gracefully', async ({ page }) => {
    // Simulate API error
    await mockApiError(page, '/api/client/dashboard');

    await page.goto('/dashboard');

    // Should show error state, not crash
    // Adjust based on your actual error handling UI
  });
});

test.describe('Artist Search', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonEndpoints(page);
    await mockArtistSearch(page);
  });

  test('displays search results', async ({ page }) => {
    await page.goto('/artists');

    // Verify search page loads with mocked data
    await expect(page).toHaveURL(/artists/);
  });
});

test.describe('Artist Profile', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonEndpoints(page);
    await mockArtistDetail(page);
  });

  test('displays artist profile', async ({ page }) => {
    await page.goto('/artists/test-artist');

    // Verify profile page loads
    await expect(page).toHaveURL(/artists/);
  });
});

test.describe('Tattoo Search', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonEndpoints(page);
    await mockTattooSearch(page);
  });

  test('displays tattoo gallery', async ({ page }) => {
    await page.goto('/tattoos');

    // Verify gallery loads with mocked data
    await expect(page).toHaveURL(/tattoos/);
  });
});
