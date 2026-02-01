/**
 * Pull API fixtures from S3 for Playwright tests
 *
 * This script downloads JSON fixtures exported by the ink-api contract tests.
 * These fixtures are used to mock API responses in Playwright E2E tests,
 * ensuring frontend tests stay in sync with actual API response structures.
 *
 * Usage:
 *   npm run pull:fixtures           # Pull fixtures for current branch
 *   npm run pull:fixtures -- main   # Pull fixtures for specific branch
 *
 * Environment variables:
 *   AWS_ACCESS_KEY_ID     - AWS access key (required in CI)
 *   AWS_SECRET_ACCESS_KEY - AWS secret key (required in CI)
 *   AWS_REGION            - AWS region (default: us-east-1)
 *   VERCEL_GIT_COMMIT_REF - Branch name (set automatically by Vercel)
 *
 * The fixtures are stored in S3 at:
 *   s3://inked-in-images/fixtures/{branch}/
 *
 * See docs/api-fixtures.md for more details.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const S3_BUCKET = 'inked-in-images';
const S3_PREFIX = 'fixtures';
const FIXTURES_DIR = path.join(__dirname, '../tests/fixtures/api');

// Determine branch from args, environment, or default to develop
const args = process.argv.slice(2);
const branch = args[0]
  || process.env.VERCEL_GIT_COMMIT_REF
  || process.env.GITHUB_REF_NAME
  || 'develop';

// Check if running in CI
const isCI = process.env.CI || process.env.VERCEL;

console.log(`[pull-fixtures] Branch: ${branch}`);
console.log(`[pull-fixtures] Target: ${FIXTURES_DIR}`);
console.log(`[pull-fixtures] CI Mode: ${isCI ? 'yes' : 'no'}`);

// Ensure fixtures directory exists
fs.mkdirSync(FIXTURES_DIR, { recursive: true });

/**
 * Attempt to sync fixtures from S3
 */
function syncFromS3(sourceBranch) {
  const s3Path = `s3://${S3_BUCKET}/${S3_PREFIX}/${sourceBranch}/`;
  console.log(`[pull-fixtures] Syncing from ${s3Path}`);

  try {
    execSync(`aws s3 sync ${s3Path} ${FIXTURES_DIR}/ --quiet`, {
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    console.log(`[pull-fixtures] Failed to sync from ${sourceBranch}`);
    return false;
  }
}

/**
 * Check if fixtures already exist locally
 */
function hasLocalFixtures() {
  const indexPath = path.join(FIXTURES_DIR, 'index.ts');
  return fs.existsSync(indexPath);
}

// Main execution
if (!isCI && hasLocalFixtures()) {
  console.log('[pull-fixtures] Local fixtures exist, skipping pull (not in CI)');
  console.log('[pull-fixtures] Run with CI=true to force pull');
  process.exit(0);
}

// Try branch-specific fixtures first, fallback to develop, then latest
const success = syncFromS3(branch)
  || (branch !== 'develop' && syncFromS3('develop'))
  || syncFromS3('latest');

if (success) {
  console.log('[pull-fixtures] Fixtures pulled successfully');

  // List what was downloaded
  try {
    const files = execSync(`find ${FIXTURES_DIR} -name "*.json" | head -20`, {
      encoding: 'utf8',
    });
    console.log('[pull-fixtures] Downloaded files:');
    console.log(files);
  } catch (e) {
    // Ignore listing errors
  }
} else {
  console.error('[pull-fixtures] Failed to pull fixtures from any source');
  console.error('[pull-fixtures] Tests will fail without fixtures');
  process.exit(1);
}
