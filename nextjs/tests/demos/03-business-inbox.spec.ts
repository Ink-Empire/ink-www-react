import { test } from '@playwright/test';
import { DEMO_ACCOUNTS, beat, dismissWelcome, gentleScroll, primeAuth } from './helpers';

/**
 * Demo 3 — The business inbox (artist side, starts signed in):
 * a real conversation holding a price quote and a deposit request card.
 */
test('business inbox with quote and deposit cards', async ({ page }) => {
  await primeAuth(page, DEMO_ACCOUNTS.artist);

  await page.goto('/inbox');
  await page.waitForLoadState('networkidle');
  await dismissWelcome(page);
  await beat(page, 3000);

  // Open the seeded conversation with Demo User
  const conversation = page.getByText('Demo User', { exact: false }).first();
  if (await conversation.isVisible().catch(() => false)) {
    await conversation.click();
    await page.waitForLoadState('networkidle');
    await beat(page, 3500);
    await gentleScroll(page, 600, 250, 500);
    await beat(page, 2500);
  }

  await beat(page, 1500);
});
