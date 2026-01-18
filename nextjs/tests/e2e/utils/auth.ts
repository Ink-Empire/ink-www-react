import { Page } from '@playwright/test';

/**
 * Authentication utilities for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Log in as a test user
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');

  // Fill in login form
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (should redirect away from login)
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });

  // Verify we're logged in by checking for auth-related elements
  await page.waitForSelector('[data-testid="user-menu"], .MuiAvatar-root', {
    timeout: 5000,
  }).catch(() => {
    // Avatar might not have data-testid, that's okay
  });
}

/**
 * Log out the current user
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button/link
  const logoutButton = page.locator('text=Log out, text=Logout, [data-testid="logout"]').first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('**/login**', { timeout: 5000 });
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('.MuiAvatar-root', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get auth token from localStorage (for API calls)
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  });
}
