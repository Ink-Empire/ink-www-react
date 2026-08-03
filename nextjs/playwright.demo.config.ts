import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// App token for API-side login (recordings start already signed in)
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Playwright configuration for DEMO RECORDINGS (not tests).
 * Runs flows slowly against the local Docker stack and records video
 * for the team presentation. Videos land in tests/demos/output/.
 *
 * Usage: npx playwright test --config=playwright.demo.config.ts
 */
export default defineConfig({
  testDir: './tests/demos',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: [['list']],
  outputDir: './tests/demos/output',

  use: {
    baseURL: process.env.DEMO_BASE_URL || 'http://dev.inkedin.test:4000',
    viewport: { width: 1440, height: 900 },
    video: { mode: 'on', size: { width: 1440, height: 900 } },
    trace: 'off',
    permissions: ['geolocation'],
    geolocation: { latitude: 38.2527, longitude: -85.7585 },
    launchOptions: {
      slowMo: 200,
    },
  },
});
