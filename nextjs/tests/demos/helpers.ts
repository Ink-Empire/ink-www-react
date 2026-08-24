import { Page } from '@playwright/test';

export const DEMO_ACCOUNTS = {
  client: { email: 'demouser@getinked.in', password: 'Demouser1!' },
  artist: { email: 'demoartist@getinked.in', password: 'Demoartist1!' },
  studio: { email: 'demoshop@getinked.in', password: 'Demoshop1!' },
};

const API_URL = process.env.DEMO_API_URL || 'http://dev.inkedin.test:8083/api';
const APP_TOKEN = process.env.NEXT_PUBLIC_API_APP_TOKEN || '';

/**
 * Authenticate via the API and inject the session into localStorage
 * BEFORE any page loads, so recordings start already signed in.
 */
export async function primeAuth(page: Page, account: { email: string; password: string }) {
  const res = await page.context().request.post(`${API_URL}/login`, {
    headers: { 'X-App-Token': APP_TOKEN, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  });
  if (!res.ok()) throw new Error(`API login failed for ${account.email}: ${res.status()}`);
  const body = await res.json();
  await page.addInitScript(
    ([token, user]: [string, unknown]) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    [body.token, body.user] as [string, unknown],
  );
}

/** A viewer-paced pause so the recording is watchable, not a speedrun. */
export async function beat(page: Page, ms = 1500) {
  await page.waitForTimeout(ms);
}

/** Type into a field at a human pace. */
export async function humanType(page: Page, selector: string, text: string) {
  const field = page.locator(selector).first();
  await field.click();
  await field.pressSequentially(text, { delay: 60 });
}

/** Dismiss the first-visit Welcome dialog if it is showing. */
export async function dismissWelcome(page: Page) {
  const btn = page.getByRole('button', { name: /start exploring/i }).first();
  if (await btn.isVisible().catch(() => false)) {
    await beat(page, 1200);
    await btn.click();
    await beat(page, 800);
  }
}

/** Scroll down gently so content reveals at a presentable pace. */
export async function gentleScroll(page: Page, totalPx: number, stepPx = 300, stepMs = 400) {
  let scrolled = 0;
  while (scrolled < totalPx) {
    await page.mouse.wheel(0, stepPx);
    scrolled += stepPx;
    await page.waitForTimeout(stepMs);
  }
}
