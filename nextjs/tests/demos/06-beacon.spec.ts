import { test } from '@playwright/test';
import { DEMO_ACCOUNTS, beat, dismissWelcome, primeAuth } from './helpers';

/**
 * Demo 6 — Tattoo Beacon: client broadcasts what they're looking for
 * from the dashboard (text-only path) and nearby artists get notified.
 */
test('client activates a tattoo beacon', async ({ page }) => {
  await primeAuth(page, DEMO_ACCOUNTS.client);

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await dismissWelcome(page);
  await beat(page, 3000);

  const getStarted = page.getByText('Get Started', { exact: false }).first();
  if (await getStarted.isVisible().catch(() => false)) {
    await getStarted.click();
    await beat(page, 2500);
  }

  const describeIt = page.getByText('No, just describe it', { exact: false }).first();
  if (await describeIt.isVisible().catch(() => false)) {
    await describeIt.click();
    await beat(page, 2000);
  }

  // Describe the tattoo idea
  const textarea = page.locator('textarea:visible').first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.pressSequentially(
      'Neo-traditional dragon half sleeve, upper arm. Bold color. Louisville area.',
      { delay: 40 },
    );
    await beat(page, 1200);
  }

  // Advance / activate
  for (let i = 0; i < 4; i++) {
    const btn = page
      .getByRole('button', { name: /activate|post|submit|turn on|continue|next|finish|done/i })
      .first();
    if (await btn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await beat(page, 2500);
    } else break;
  }

  await beat(page, 3000);
});
