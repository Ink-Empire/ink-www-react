import { test } from '@playwright/test';
import { DEMO_ACCOUNTS, beat, dismissWelcome, gentleScroll, primeAuth } from './helpers';

/**
 * Demo 4 — Client home base (starts signed in): active tattoo beacon,
 * upcoming bookings, saved artist with books-open alerts, inbox reply.
 */
test('client dashboard with beacon and bookings', async ({ page }) => {
  await primeAuth(page, DEMO_ACCOUNTS.client);

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await dismissWelcome(page);
  await beat(page, 3500);
  await gentleScroll(page, 900);
  await beat(page, 2000);

  // Wishlist with books-open notification toggle
  await page.goto('/wishlist');
  await page.waitForLoadState('networkidle');
  await beat(page, 3000);

  // The conversation from the client's side (quote + deposit request received)
  await page.goto('/inbox');
  await page.waitForLoadState('networkidle');
  await beat(page, 2500);
  const conversation = page.getByText('Demo Artist', { exact: false }).first();
  if (await conversation.isVisible().catch(() => false)) {
    await conversation.click();
    await page.waitForLoadState('networkidle');
    await beat(page, 3500);
    await gentleScroll(page, 500, 250, 500);
    await beat(page, 2000);
  }

  await beat(page, 1500);
});
