import { test } from '@playwright/test';
import { DEMO_ACCOUNTS, beat, dismissWelcome, gentleScroll, primeAuth } from './helpers';

/**
 * Demo 1 — Client discovery (recording starts signed in):
 * browse artists, open a profile, check portfolio and availability.
 */
test('client discovers an artist', async ({ page }) => {
  await primeAuth(page, DEMO_ACCOUNTS.client);

  await page.goto('/artists');
  await page.waitForLoadState('networkidle');
  await dismissWelcome(page);
  await beat(page, 2500);
  await gentleScroll(page, 600);
  await beat(page, 1500);

  await page.goto('/artists/demo-artist');
  await page.waitForLoadState('networkidle');
  await dismissWelcome(page);
  await beat(page, 2500);
  await gentleScroll(page, 800);
  await beat(page, 1500);

  const availability = page.getByText('View Availability', { exact: false }).first();
  if (await availability.isVisible().catch(() => false)) {
    await availability.click();
    await page.waitForLoadState('networkidle');
    await beat(page, 3000);
  }

  await beat(page, 1500);
});
