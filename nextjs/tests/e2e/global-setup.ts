/**
 * Playwright Global Setup
 *
 * Runs once before all tests. Verifies fixtures exist.
 * Fixtures are committed to the repo, so no S3 pull needed.
 */

import * as fs from 'fs';
import * as path from 'path';

const FIXTURES_DIR = path.join(__dirname, '../fixtures/api');

async function globalSetup() {
  console.log('\n[global-setup] Checking fixtures...');

  const hasFixtures = fs.existsSync(path.join(FIXTURES_DIR, 'index.ts'));

  if (hasFixtures) {
    console.log('[global-setup] Fixtures found, ready to run tests\n');
  } else {
    console.error('[global-setup] No fixtures found at', FIXTURES_DIR);
    console.error('[global-setup] Run `npm run pull:fixtures` to download from S3\n');
  }
}

export default globalSetup;
