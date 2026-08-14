import { test } from '@playwright/test';
import { beat } from './helpers';

/**
 * Demo 5 — Client signup wizard, walked end to end with a fresh account.
 */
test('client signup wizard', async ({ page }) => {
  const stamp = Date.now() % 100000;
  const email = `demo.signup.${stamp}@getinked.in`;

  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await beat(page, 2000);

  // Step 1: user type — client card auto-advances
  await page.getByText('looking for inspiration', { exact: false }).first().click();
  await beat(page, 2000);

  // Step 2: experience level
  const newTo = page.getByText('New to Tattoos', { exact: false }).first();
  if (await newTo.isVisible().catch(() => false)) {
    await newTo.click();
    await beat(page, 2000);
  }

  // Remaining steps: fill known fields, prefer Continue, fall back to Skip
  for (let i = 0; i < 12; i++) {
    if (page.url().includes('verify-email') || page.url().includes('dashboard')) break;

    const nameField = page.locator('input[name="name"]');
    if (await nameField.isVisible().catch(() => false) && !(await nameField.inputValue())) {
      await nameField.pressSequentially('Alex Rivera', { delay: 50 });
      await beat(page, 600);
    }
    const usernameField = page.locator('input[name="username"]');
    if (await usernameField.isVisible().catch(() => false) && !(await usernameField.inputValue())) {
      await usernameField.pressSequentially(`alexrivera${stamp}`, { delay: 50 });
      await beat(page, 600);
    }
    const emailField = page.locator('input[name="email"]');
    if (await emailField.isVisible().catch(() => false) && !(await emailField.inputValue())) {
      await emailField.pressSequentially(email, { delay: 40 });
      await beat(page, 600);
    }
    const pwFields = page.locator('input[type="password"]');
    const pwCount = await pwFields.count();
    for (let p = 0; p < pwCount; p++) {
      const f = pwFields.nth(p);
      if (await f.isVisible().catch(() => false) && !(await f.inputValue())) {
        await f.pressSequentially('DemoPass1!', { delay: 40 });
        await beat(page, 400);
      }
    }

    // Location autocomplete (required on the profile step)
    const locationField = page.locator('input[placeholder*="city" i]').first();
    if (await locationField.isVisible().catch(() => false) && !(await locationField.inputValue())) {
      await locationField.click();
      await locationField.pressSequentially('Louisville', { delay: 70 });
      await beat(page, 2000);
      await page.keyboard.press('ArrowDown');
      await beat(page, 500);
      await page.keyboard.press('Enter');
      await beat(page, 1200);
    }

    // Style cards: pick a couple if this looks like the styles step
    const styleChip = page.getByText('Neo-Traditional', { exact: false }).first();
    if (await styleChip.isVisible().catch(() => false)) {
      await styleChip.click();
      await beat(page, 700);
      const second = page.getByText('Japanese', { exact: false }).first();
      if (await second.isVisible().catch(() => false)) {
        await second.click();
        await beat(page, 700);
      }
    }

    const advance = page
      .getByRole('button', { name: /create account|complete|continue|next|finish/i })
      .filter({ hasNot: page.locator('[disabled]') })
      .first();
    if (await advance.isEnabled().catch(() => false)) {
      await advance.click();
      await beat(page, 2200);
      continue;
    }
    const skip = page.getByRole('button', { name: /skip/i }).first();
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await beat(page, 2200);
      continue;
    }
    break;
  }

  await beat(page, 3000);
});
