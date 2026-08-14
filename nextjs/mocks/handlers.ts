import { http, HttpResponse } from 'msw';

/**
 * MSW Request Handlers
 *
 * These handlers intercept API requests during testing.
 * They work for both server-side (SSR) and client-side requests.
 */

// Import fixtures - these are loaded at build time
import artistDetail from '../tests/fixtures/api/artist/detail.json';
import artistSearch from '../tests/fixtures/api/artist/search.json';
import artistSettingsOwner from '../tests/fixtures/api/artist/settings-owner.json';
import artistWorkingHours from '../tests/fixtures/api/artist/working-hours.json';
import artistDashboardStats from '../tests/fixtures/api/artist/dashboard-stats.json';
import clientDashboard from '../tests/fixtures/api/client/dashboard.json';
import clientFavorites from '../tests/fixtures/api/client/favorites.json';
import clientWishlist from '../tests/fixtures/api/client/wishlist.json';
import clientSuggestedArtists from '../tests/fixtures/api/client/suggested-artists.json';
import tattooDetail from '../tests/fixtures/api/tattoo/detail.json';
import tattooSearch from '../tests/fixtures/api/tattoo/search.json';
import userProfile from '../tests/fixtures/api/user/profile.json';

// Base URL for API - will be replaced based on environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export const handlers = [
  // Sanctum CSRF
  http.get('*/sanctum/csrf-cookie', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=mock-csrf-token; Path=/',
      },
    });
  }),

  // Auth endpoints
  http.post('*/api/login', () => {
    return HttpResponse.json({
      token: 'mock-auth-token',
      user: {
        id: 999,
        name: 'Test User',
        email: 'test@example.com',
        email_verified_at: new Date().toISOString(),
      },
    });
  }),

  http.post('*/api/register', () => {
    return HttpResponse.json({
      token: 'mock-auth-token-for-testing',
      user: {
        id: 999,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        type_id: 1,
        email_verified_at: null,
      },
      message: 'Registration successful. Please verify your email.',
    });
  }),

  http.post('*/api/verify-email', () => {
    return HttpResponse.json({
      token: 'mock-auth-token-verified',
      user: {
        id: 999,
        name: 'Test User',
        email: 'test@example.com',
        email_verified_at: new Date().toISOString(),
      },
      message: 'Email verified successfully.',
    });
  }),

  // Availability checks
  http.get('*/api/check-availability', () => {
    return HttpResponse.json({ available: true });
  }),

  http.get('*/api/check-username*', () => {
    return HttpResponse.json({ available: true });
  }),

  http.get('*/api/check-email*', () => {
    return HttpResponse.json({ available: true });
  }),

  http.get('*/api/username', () => {
    return HttpResponse.json({ available: true });
  }),

  // Client dashboard endpoints
  http.get('*/api/client/dashboard', () => {
    return HttpResponse.json(clientDashboard);
  }),

  http.get('*/api/client/favorites', () => {
    return HttpResponse.json(clientFavorites);
  }),

  http.get('*/api/client/wishlist', () => {
    return HttpResponse.json(clientWishlist);
  }),

  http.get('*/api/client/suggested-artists', () => {
    return HttpResponse.json(clientSuggestedArtists);
  }),

  // Artist endpoints
  http.post('*/api/artists', () => {
    return HttpResponse.json(artistSearch);
  }),

  http.get('*/api/artists/me/studio-invitations', () => {
    return HttpResponse.json({ invitations: [] });
  }),

  http.get('*/api/artists/:id/settings', () => {
    return HttpResponse.json(artistSettingsOwner);
  }),

  http.get('*/api/artists/:id/working-hours', () => {
    return HttpResponse.json(artistWorkingHours);
  }),

  http.get('*/api/artists/:id/dashboard-stats', () => {
    return HttpResponse.json(artistDashboardStats);
  }),

  http.get('*/api/artists/:id', () => {
    return HttpResponse.json(artistDetail);
  }),

  // Tattoo endpoints
  http.post('*/api/tattoos', () => {
    return HttpResponse.json(tattooSearch);
  }),

  http.get('*/api/tattoos/:id', () => {
    return HttpResponse.json(tattooDetail);
  }),

  // User endpoints
  http.get('*/api/users/:id', () => {
    return HttpResponse.json(userProfile);
  }),

  // Reference data endpoints
  http.get('*/api/styles', () => {
    return HttpResponse.json({
      styles: [
        { id: 1, name: 'Traditional', parent_id: null },
        { id: 2, name: 'Japanese', parent_id: null },
        { id: 3, name: 'Blackwork', parent_id: null },
        { id: 4, name: 'Realism', parent_id: null },
        { id: 5, name: 'Neo-Traditional', parent_id: null },
      ],
    });
  }),

  http.get('*/api/placements', () => {
    return HttpResponse.json({
      placements: [
        { id: 1, name: 'Arm' },
        { id: 2, name: 'Leg' },
        { id: 3, name: 'Back' },
        { id: 4, name: 'Chest' },
        { id: 5, name: 'Shoulder' },
      ],
    });
  }),

  http.get('*/api/tags', () => {
    return HttpResponse.json({
      tags: [
        { id: 1, name: 'flower' },
        { id: 2, name: 'skull' },
        { id: 3, name: 'dragon' },
        { id: 4, name: 'portrait' },
        { id: 5, name: 'geometric' },
      ],
    });
  }),

  // Studio endpoints
  http.get('*/api/studios/check-availability', () => {
    return HttpResponse.json({ available: true });
  }),

  http.post('*/api/studios/lookup-or-create', () => {
    return HttpResponse.json({
      studio: {
        id: 999,
        name: 'Test Studio',
        slug: 'test-studio',
      },
      created: true,
    });
  }),

  // Places/location endpoints
  http.get('*/api/places/config', () => {
    return HttpResponse.json({ apiKey: 'mock-api-key' });
  }),

  // Google Maps APIs
  http.get('*/maps.googleapis.com/maps/api/geocode/*', () => {
    return HttpResponse.json({
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
    });
  }),

  http.get('*/maps.googleapis.com/maps/api/place/*', () => {
    return HttpResponse.json({
      results: [{
        formatted_address: 'New York, NY, USA',
        name: 'New York',
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 },
        },
      }],
      status: 'OK',
    });
  }),
];
