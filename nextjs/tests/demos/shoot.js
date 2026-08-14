/* Plain-Node screenshot capture for the deck — no test runner. */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Screenshots land next to this script; the folder is gitignored.
const OUT = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const API = 'http://dev.inkedin.test:8083/api';
const APP = 'http://dev.inkedin.test:4000';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  console.log('login...');
  const res = await ctx.request.post(`${API}/login`, {
    data: { email: 'demoartist@getinked.in', password: 'Demoartist1!' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  await page.addInitScript(([t, u]) => {
    localStorage.setItem('auth_token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, [body.token, body.user]);

  console.log('goto inbox...');
  await page.goto(`${APP}/inbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  async function clearWelcome() {
    const btn = page.getByRole('button', { name: /start exploring/i }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 5000 }).catch(e => console.log('welcome click:', e.message));
      await page.waitForTimeout(800);
    }
  }
  await clearWelcome();

  console.log('open conversation...');
  await page.getByText('Demo User', { exact: false }).first()
    .click({ timeout: 10000 }).catch(e => console.log('conv click:', e.message));
  await page.waitForTimeout(3000);
  await clearWelcome();

  console.log('shooting...');
  await page.screenshot({ path: `${OUT}/inbox-full.png`, timeout: 15000 });
  console.log('full ok');
  await page.screenshot({ path: `${OUT}/inbox-thread.png`, clip: { x: 380, y: 0, width: 1060, height: 820 }, timeout: 15000 });
  console.log('thread ok');
  await page.mouse.move(900, 400);
  await page.mouse.wheel(0, -450);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/inbox-thread-cards.png`, clip: { x: 380, y: 0, width: 1060, height: 820 }, timeout: 15000 });
  console.log('cards ok');

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
