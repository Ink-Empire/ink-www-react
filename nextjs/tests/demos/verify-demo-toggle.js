const { chromium } = require('@playwright/test');
const APP = 'http://dev.inkedin.test:4000';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.setDefaultTimeout(20000);

  await page.goto(APP + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const toggle = page.getByText('View in demo mode', { exact: false }).first();
  console.log('toggle visible:', await toggle.isVisible().catch(() => false));
  await toggle.click();
  await page.waitForTimeout(800);
  console.log('localStorage:', await page.evaluate(() => localStorage.getItem('inkedin_demo_mode')));

  await page.goto(APP + '/artists', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const btn = page.getByRole('button', { name: /start exploring/i }).first();
  if (await btn.isVisible().catch(() => false)) { await btn.click(); await page.waitForTimeout(500); }
  const demoVisible = await page.getByText('Demo Artist', { exact: false }).first().isVisible().catch(() => false);
  console.log('demo artist in results (toggle ON):', demoVisible);

  await page.evaluate(() => localStorage.setItem('inkedin_demo_mode', 'false'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const demoStill = await page.getByText('Demo Artist', { exact: false }).first().isVisible().catch(() => false);
  console.log('demo artist in results (toggle OFF):', demoStill);

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
