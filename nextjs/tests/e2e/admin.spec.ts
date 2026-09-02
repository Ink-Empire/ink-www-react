import { test, expect, ConsoleMessage } from '@playwright/test';

/**
 * Admin panel smoke tests.
 *
 * The admin panel had no test of any kind, and a missing import once blanked
 * a whole screen behind the error boundary while the type check stayed green.
 * These do not assert what a screen contains, only that every screen mounts
 * and none of them throw. That is the failure the panel is actually prone to.
 *
 * MSW answers the API (see mocks/handlers.ts), so no backend is needed.
 */

const ADMIN_ROUTES = [
  { path: '', name: 'Dashboard' },
  { path: 'users', name: 'Users' },
  { path: 'studios', name: 'Studios' },
  { path: 'tattoos', name: 'Tattoos' },
  { path: 'tattoo-leads', name: 'Beacons' },
  { path: 'tags', name: 'Tags' },
  { path: 'placements', name: 'Placements' },
  { path: 'blocked-terms', name: 'Blocked terms' },
  { path: 'elastic', name: 'Elasticsearch' },
  { path: 'email-test', name: 'Email testing' },
  { path: 'docs', name: 'Documentation' },
  { path: 'onboard-artist', name: 'Onboard artist' },
  { path: 'commands', name: 'Commands' },
];

const IGNORED_TEXT = [
  'webpack-hmr',
  'Download the React DevTools',
  'favicon',
  'ERR_NAME_NOT_RESOLVED',
  'Pusher',
  'WebSocket',
  'Failed to fetch Places API config',
  'Google Places API key not available',
];

/**
 * Failed requests are matched on URL rather than message, because "Failed to
 * load resource: 404" says nothing about what failed. Ignoring that text
 * outright would hide a genuinely missing admin endpoint.
 *
 * _app preloads the Maps SDK from a useEffect that is not gated on MSW being
 * ready, so this one request always escapes the mock and fails.
 */
const IGNORED_URLS = [
  '/api/places/config',
  'maps.googleapis.com',
  // Vercel analytics, which 403s outside a Vercel deployment.
  'va.vercel-scripts.com',
];

/**
 * Errors that say the page itself broke, as opposed to the noise a dev build
 * makes. Anything not matched here fails the test.
 */
const isRealError = (message: ConsoleMessage): boolean => {
  const text = message.text();
  const url = message.location()?.url ?? '';

  if (IGNORED_TEXT.some(pattern => text.includes(pattern))) {
    return false;
  }

  return !IGNORED_URLS.some(pattern => url.includes(pattern));
};

test.describe('Admin panel', () => {
  test.beforeEach(async ({ page }) => {
    // react-admin's authProvider reads the token, then re-verifies against
    // /users/me on every route change. admin_user is what getIdentity reads.
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token-for-testing');
      localStorage.setItem('admin_user', JSON.stringify({
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        is_admin: true,
      }));
    });
  });

  for (const route of ADMIN_ROUTES) {
    test(`${route.name} renders without crashing`, async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', error => {
        errors.push(`Uncaught: ${error.message}`);
      });

      page.on('console', (message: ConsoleMessage) => {
        if (message.type() === 'error' && isRealError(message)) {
          // "Failed to load resource: 403" on its own says nothing about what
          // failed, so carry the URL into the failure report.
          const url = message.location()?.url ?? '';
          errors.push(url ? `${message.text()} [${url}]` : message.text());
        }
      });

      await page.goto(`/admin#/${route.path}`);

      // The panel is a client-rendered SPA behind an auth check, so wait for
      // its chrome rather than for load.
      await expect(page.locator('.RaLayout-content, main').first()).toBeVisible({
        timeout: 30000,
      });

      // react-admin catches a render failure and swaps in its own error
      // screen, so the page still "loads" when the screen is broken.
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      await expect(page.getByText('Sorry, an error occurred')).toHaveCount(0);

      expect(errors, `Console errors on /admin#/${route.path}`).toEqual([]);
    });
  }

  test('every screen is reachable from the sidebar', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.locator('.RaLayout-content, main').first()).toBeVisible({
      timeout: 30000,
    });

    // Guards the sweep above: if a route is dropped from the menu the sweep
    // would still pass by visiting a URL nothing links to any more.
    for (const route of ADMIN_ROUTES) {
      await expect(page.locator(`a[href="#/${route.path}"]`).first()).toBeAttached();
    }
  });
});
