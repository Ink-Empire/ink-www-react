/**
 * Playwright Global Setup
 *
 * Runs once before all tests. Pulls API fixtures from S3 to ensure
 * tests have up-to-date mock data.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const S3_BUCKET = 'inked-in-images';
const S3_PREFIX = 'fixtures';
const FIXTURES_DIR = path.join(__dirname, '../fixtures/api');

async function globalSetup() {
  console.log('\n[global-setup] Checking fixtures...');

  // Determine branch
  const branch = process.env.VERCEL_GIT_COMMIT_REF
    || process.env.GITHUB_REF_NAME
    || 'develop';

  // Check if we should skip pulling (local dev with existing fixtures)
  const isCI = process.env.CI || process.env.VERCEL;
  const hasLocalFixtures = fs.existsSync(path.join(FIXTURES_DIR, 'index.ts'));

  if (!isCI && hasLocalFixtures) {
    console.log('[global-setup] Local fixtures exist, skipping pull');
    console.log('[global-setup] Set CI=true to force pull from S3\n');
    return;
  }

  // Ensure directory exists
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  // Try to pull fixtures
  const sources = [branch, 'develop', 'latest'];

  for (const source of sources) {
    if (source === 'develop' && branch === 'develop') continue;

    const s3Path = `s3://${S3_BUCKET}/${S3_PREFIX}/${source}/`;
    console.log(`[global-setup] Pulling fixtures from ${source}...`);

    try {
      execSync(`aws s3 sync ${s3Path} ${FIXTURES_DIR}/ --quiet`, {
        stdio: 'pipe',
      });
      console.log(`[global-setup] Fixtures pulled from ${source}\n`);
      return;
    } catch (error) {
      console.log(`[global-setup] Failed to pull from ${source}`);
    }
  }

  // If we get here, all pulls failed
  if (hasLocalFixtures) {
    console.log('[global-setup] Using existing local fixtures\n');
  } else {
    console.error('[global-setup] No fixtures available - tests may fail\n');
  }
}

export default globalSetup;
