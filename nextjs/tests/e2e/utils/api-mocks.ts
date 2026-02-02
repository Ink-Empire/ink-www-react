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

/**
 * Mock registration endpoint
 */
export async function mockRegistration(page: Page, options?: {
  shouldSucceed?: boolean;
  errorMessage?: string;
  userType?: 'client' | 'artist' | 'studio';
}) {
  const { shouldSucceed = true, errorMessage, userType = 'client' } = options || {};

  await page.route('**/api/register', route => {
    if (!shouldSucceed) {
      route.fulfill({
        status: 422,
        json: { message: errorMessage || 'Registration failed', errors: {} },
      });
      return;
    }

    // Mock successful registration response
    route.fulfill({
      json: {
        token: 'mock-auth-token-for-testing',
        user: {
          id: 999,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser',
          type_id: userType === 'artist' ? 2 : userType === 'studio' ? 3 : 1,
          email_verified_at: null,
        },
        message: 'Registration successful. Please verify your email.',
      },
    });
  });
}

/**
 * Mock email verification endpoint
 */
export async function mockEmailVerification(page: Page, options?: {
  shouldSucceed?: boolean;
  errorMessage?: string;
}) {
  const { shouldSucceed = true, errorMessage } = options || {};

  await page.route('**/api/verify-email', route => {
    if (!shouldSucceed) {
      route.fulfill({
        status: 400,
        json: { message: errorMessage || 'Invalid verification code' },
      });
      return;
    }

    route.fulfill({
      json: {
        token: 'mock-auth-token-verified',
        user: {
          id: 999,
          name: 'Test User',
          email: 'test@example.com',
          email_verified_at: new Date().toISOString(),
        },
        message: 'Email verified successfully.',
      },
    });
  });
}

/**
 * Mock login endpoint
 */
export async function mockLogin(page: Page, options?: {
  shouldSucceed?: boolean;
  errorMessage?: string;
  requiresVerification?: boolean;
}) {
  const { shouldSucceed = true, errorMessage, requiresVerification = false } = options || {};

  await page.route('**/api/login', route => {
    if (!shouldSucceed) {
      route.fulfill({
        status: 401,
        json: { message: errorMessage || 'Invalid credentials' },
      });
      return;
    }

    if (requiresVerification) {
      route.fulfill({
        status: 403,
        json: {
          message: 'Email not verified',
          requires_verification: true,
          email: 'test@example.com',
        },
      });
      return;
    }

    route.fulfill({
      json: {
        token: 'mock-auth-token',
        user: {
          id: 999,
          name: 'Test User',
          email: 'test@example.com',
          email_verified_at: new Date().toISOString(),
        },
      },
    });
  });
}

/**
 * Mock styles endpoint (used in registration)
 */
export async function mockStyles(page: Page) {
  await page.route('**/api/styles', route => {
    route.fulfill({
      json: {
        styles: [
          { id: 1, name: 'Traditional', parent_id: null },
          { id: 2, name: 'Japanese', parent_id: null },
          { id: 3, name: 'Blackwork', parent_id: null },
          { id: 4, name: 'Realism', parent_id: null },
          { id: 5, name: 'Neo-Traditional', parent_id: null },
        ],
      },
    });
  });
}

/**
 * Mock username availability check
 */
export async function mockUsernameCheck(page: Page, available = true) {
  // Various username check endpoints
  await page.route('**/api/check-username**', route => {
    route.fulfill({
      json: { available },
    });
  });

  await page.route('**/api/username', route => {
    route.fulfill({
      json: { available },
    });
  });
}

/**
 * Mock email availability check
 */
export async function mockEmailCheck(page: Page, available = true) {
  await page.route('**/api/check-email**', route => {
    route.fulfill({
      json: { available },
    });
  });
}

/**
 * Mock check-availability endpoint (used for email/username validation)
 */
export async function mockCheckAvailability(page: Page) {
  await page.route('**/api/check-availability', route => {
    route.fulfill({
      json: { available: true },
    });
  });
}

/**
 * Mock studio-specific endpoints
 */
export async function mockStudioEndpoints(page: Page) {
  // Studio availability check
  await page.route('**/api/studios/check-availability', route => {
    route.fulfill({
      json: { available: true },
    });
  });

  // Studio lookup or create
  await page.route('**/api/studios/lookup-or-create', route => {
    route.fulfill({
      json: {
        studio: {
          id: 999,
          name: 'Test Studio',
          slug: 'test-studio',
        },
        created: true,
      },
    });
  });

  // Google Places API config (used for studio location)
  await page.route('**/api/places/config', route => {
    route.fulfill({
      json: { apiKey: 'mock-api-key' },
    });
  });
}

/**
 * Mock Google geocoding/places APIs for location lookup
 */
export async function mockGeolocation(page: Page) {
  // Google Geocoding API (reverse geocoding)
  await page.route('**/maps.googleapis.com/maps/api/geocode/**', route => {
    route.fulfill({
      json: {
        results: [{
          formatted_address: 'New York, NY, USA',
          address_components: [
            { long_name: 'New York', short_name: 'NY', types: ['locality'] },
            { long_name: 'New York', short_name: 'NY', types: ['administrative_area_level_1'] },
            { long_name: 'United States', short_name: 'US', types: ['country'] },
          ],
          geometry: {
            location: { lat: 40.7128, lng: -74.0060 },
          },
        }],
        status: 'OK',
      },
    });
  });

  // Google Places API
  await page.route('**/maps.googleapis.com/maps/api/place/**', route => {
    route.fulfill({
      json: {
        results: [{
          formatted_address: 'New York, NY, USA',
          name: 'New York',
          geometry: {
            location: { lat: 40.7128, lng: -74.0060 },
          },
        }],
        status: 'OK',
      },
    });
  });
}

/**
 * Mock all registration-related endpoints
 */
export async function mockRegistrationFlow(page: Page) {
  await mockRegistration(page);
  await mockEmailVerification(page);
  await mockStyles(page);
  await mockUsernameCheck(page);
  await mockEmailCheck(page);
  await mockCheckAvailability(page);
  await mockStudioEndpoints(page);
  await mockGeolocation(page);
}
