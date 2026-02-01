import { Page } from '@playwright/test';
import { apiFixtures } from '../../fixtures/api';

/**
 * API Mocking Utilities
 *
 * Helper functions to mock API responses in Playwright tests using
 * fixtures exported from ink-api contract tests.
 *
 * Usage:
 *   import { mockClientDashboard, mockArtistSearch } from './utils/api-mocks';
 *
 *   test.beforeEach(async ({ page }) => {
 *     await mockClientDashboard(page);
 *   });
 */

/**
 * Mock all client dashboard endpoints
 */
export async function mockClientDashboard(page: Page) {
  await page.route('**/api/client/dashboard', route => {
    route.fulfill({ json: apiFixtures.client.dashboard });
  });

  await page.route('**/api/client/favorites', route => {
    route.fulfill({ json: apiFixtures.client.favorites });
  });

  await page.route('**/api/client/wishlist', route => {
    route.fulfill({ json: apiFixtures.client.wishlist });
  });

  await page.route('**/api/client/suggested-artists', route => {
    route.fulfill({ json: apiFixtures.client.suggestedArtists });
  });
}

/**
 * Mock artist search endpoint
 */
export async function mockArtistSearch(page: Page) {
  await page.route('**/api/artists', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({ json: apiFixtures.artist.search });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock artist detail endpoint
 */
export async function mockArtistDetail(page: Page) {
  await page.route('**/api/artists/*', route => {
    const url = route.request().url();
    // Don't mock search, settings, or other sub-routes
    if (url.includes('/settings') || url.includes('/working-hours') || url.includes('/dashboard-stats')) {
      route.continue();
      return;
    }
    if (route.request().method() === 'GET') {
      route.fulfill({ json: apiFixtures.artist.detail });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock artist settings endpoint (owner view)
 */
export async function mockArtistSettings(page: Page) {
  await page.route('**/api/artists/*/settings', route => {
    route.fulfill({ json: apiFixtures.artist.settingsOwner });
  });
}

/**
 * Mock artist dashboard stats
 */
export async function mockArtistDashboardStats(page: Page) {
  await page.route('**/api/artists/*/dashboard-stats', route => {
    route.fulfill({ json: apiFixtures.artist.dashboardStats });
  });
}

/**
 * Mock tattoo search endpoint
 */
export async function mockTattooSearch(page: Page) {
  await page.route('**/api/tattoos', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({ json: apiFixtures.tattoo.search });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock tattoo detail endpoint
 */
export async function mockTattooDetail(page: Page) {
  await page.route('**/api/tattoos/*', route => {
    if (route.request().method() === 'GET') {
      route.fulfill({ json: apiFixtures.tattoo.detail });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock user profile endpoint
 */
export async function mockUserProfile(page: Page) {
  await page.route('**/api/users/*', route => {
    if (route.request().method() === 'GET') {
      route.fulfill({ json: apiFixtures.user.profile });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock authenticated user session
 */
export async function mockAuthenticatedUser(page: Page, user?: {
  id?: number;
  name?: string;
  email?: string;
  type?: 'client' | 'artist';
}) {
  const defaultUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    type: 'client' as const,
    ...user,
  };

  await page.addInitScript((userData) => {
    localStorage.setItem('auth_token', 'mock-token-for-testing');
    localStorage.setItem('user', JSON.stringify(userData));
  }, defaultUser);
}

/**
 * Mock API error response
 */
export async function mockApiError(page: Page, endpoint: string, status = 500, message = 'Internal server error') {
  await page.route(`**${endpoint}`, route => {
    route.fulfill({
      status,
      json: { error: message },
    });
  });
}

/**
 * Mock empty response for testing empty states
 */
export async function mockEmptyResponse(page: Page, endpoint: string, emptyData: object) {
  await page.route(`**${endpoint}`, route => {
    route.fulfill({ json: emptyData });
  });
}
