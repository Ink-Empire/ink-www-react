import { test } from '@playwright/test';
import { DEMO_ACCOUNTS, beat, dismissWelcome, gentleScroll, primeAuth } from './helpers';

/**
 * Demo 2 — Artist dashboard (recording starts signed in):
 * stats, pending requests, and the clients tab with CRM data.
 */
test('artist dashboard and client CRM', async ({ page }) => {
  await primeAuth(page, DEMO_ACCOUNTS.artist);

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await dismissWelcome(page);
  await beat(page, 3000);
  await gentleScroll(page, 700);
  await beat(page, 1500);

  // Clients tab (CRM) — seeded with Demo User, tags and a session note
  const clientsTab = page
    .getByRole('tab', { name: /clients/i })
    .or(page.getByText('My Clients', { exact: false }))
    .first();
  if (await clientsTab.isVisible().catch(() => false)) {
    await clientsTab.click();
    await page.waitForLoadState('networkidle');
    await beat(page, 3000);

    // Open the seeded client profile if it renders as a clickable row
    const clientRow = page.getByText('Demo User', { exact: false }).first();
    if (await clientRow.isVisible().catch(() => false)) {
      await clientRow.click();
      await page.waitForLoadState('networkidle');
      await beat(page, 3500);
      await gentleScroll(page, 500);
      await beat(page, 1500);
    }
  }

  await beat(page, 1500);
});
