import { test } from '@playwright/test';
import { DEMO_ACCOUNTS, beat, dismissWelcome, primeAuth } from './helpers';

const OUT = '/private/tmp/claude-501/-Users-carolineennis-projects-orpical-unique-snacks/8ebae9a0-e76a-4406-b55c-483133ea8bd5/scratchpad/deck/shots';

/** Capture real inbox screenshots for the deck (not a test). */
test('capture inbox screenshots', async ({ page }) => {
  test.setTimeout(120000);
  await primeAuth(page, DEMO_ACCOUNTS.artist);
  await page.goto('/inbox');
  await page.waitForLoadState('domcontentloaded');
  await dismissWelcome(page);
  await beat(page, 2500);

  const conversation = page.getByText('Demo User', { exact: false }).first();
  if (await conversation.isVisible().catch(() => false)) {
    await conversation.click();
    await beat(page, 3000);
  }

  // The Welcome modal can appear late; clear it before shooting
  await beat(page, 2000);
  await dismissWelcome(page);

  // Full inbox view
  await page.screenshot({ path: `${OUT}/inbox-full.png`, timeout: 20000, animations: 'disabled' }).catch(e => console.log('full shot failed:', e.message));

  // Thread panel only (right side of the 1440x900 viewport)
  await page.screenshot({ path: `${OUT}/inbox-thread.png`, clip: { x: 380, y: 0, width: 1060, height: 820 }, timeout: 20000, animations: 'disabled' }).catch(e => console.log('thread shot failed:', e.message));

  // Scroll the thread up a touch to frame the booking-request card too
  await page.mouse.move(900, 400);
  await page.mouse.wheel(0, -400);
  await beat(page, 1500);
  await page.screenshot({ path: `${OUT}/inbox-thread-cards.png`, clip: { x: 380, y: 0, width: 1060, height: 820 }, timeout: 20000, animations: 'disabled' }).catch(e => console.log('cards shot failed:', e.message));
});
