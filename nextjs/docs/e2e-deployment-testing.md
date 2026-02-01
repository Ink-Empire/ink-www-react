# E2E Deployment Testing Options

## Overview

Running Playwright tests in CI/CD with a separate backend repo (ink-api).

---

## Option 1: Test Against Staging API (Recommended)

Run tests against a deployed staging environment. Simplest setup, tests real integration.

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: https://staging.getinked.in
          API_URL: https://api.staging.getinked.in

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**Pros:**
- Simple setup
- Tests real API integration
- No need to manage backend in CI

**Cons:**
- Requires staging environment to be up
- Tests may be affected by staging data state
- Can't test unreleased backend changes

---

## Option 2: Vercel Preview Deployment Testing

Automatically run tests when Vercel deploys a preview. Great for PR validation.

```yaml
# .github/workflows/e2e-preview.yml
name: E2E on Vercel Preview

on:
  deployment_status:

jobs:
  test:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - run: npx playwright install --with-deps

      - name: Run tests against preview
        run: npx playwright test
        env:
          BASE_URL: ${{ github.event.deployment_status.target_url }}
          API_URL: https://api.staging.getinked.in

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**Pros:**
- Tests every PR automatically
- Uses actual Vercel deployment
- Catches frontend regressions before merge

**Cons:**
- Still needs staging API
- Preview URL changes per deployment

---

## Option 3: Mock API Responses

Use Playwright's route interception to mock API responses. No backend needed.

```typescript
// tests/e2e/mocks/handlers.ts
export const mockArtist = {
  id: 1,
  name: 'Test Artist',
  slug: 'test-artist',
  // ...
};

// In test file
test.beforeEach(async ({ page }) => {
  await page.route('**/api/artists/*', route => {
    route.fulfill({ json: mockArtist });
  });
});
```

**Pros:**
- Fast, no external dependencies
- Predictable test data
- Can run anywhere

**Cons:**
- Doesn't test real API integration
- Mocks can drift from actual API
- More maintenance

---

## Option 4: Checkout Both Repos

Clone both repos in the same workflow. Useful if you need to test unreleased backend changes.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: inkedin_test
          MYSQL_ROOT_PASSWORD: secret
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v4
        with:
          repository: your-org/ink-api
          path: ink-api
          token: ${{ secrets.REPO_ACCESS_TOKEN }}

      - uses: actions/checkout@v4
        with:
          path: frontend

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'

      - name: Start API
        working-directory: ./ink-api
        run: |
          composer install
          cp .env.testing .env
          php artisan migrate --seed
          php artisan serve &

      - name: Run frontend tests
        working-directory: ./frontend/nextjs
        run: |
          npm ci
          npx playwright install --with-deps
          npx playwright test
        env:
          BASE_URL: http://localhost:3000
          API_URL: http://localhost:8000
```

**Pros:**
- Tests against specific backend version
- Full control over test data
- Can test unreleased changes together

**Cons:**
- Complex setup
- Slower CI runs
- Requires cross-repo access token

---

## Option 5: Trigger Tests from Backend Repo

When backend deploys to staging, trigger frontend E2E tests.

```yaml
# In ink-api repo: .github/workflows/deploy.yml
- name: Trigger E2E tests
  if: success()
  uses: peter-evans/repository-dispatch@v2
  with:
    token: ${{ secrets.REPO_ACCESS_TOKEN }}
    repository: your-org/inked-in-www
    event-type: run-e2e-tests
    client-payload: '{"api_version": "${{ github.sha }}"}'
```

```yaml
# In frontend repo: .github/workflows/e2e-triggered.yml
on:
  repository_dispatch:
    types: [run-e2e-tests]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ... run tests against staging
```

**Pros:**
- Tests run after backend changes
- Catches API breaking changes

**Cons:**
- Only runs on backend deploy, not frontend changes
- Requires coordination between repos

---

## Recommendation

**Start with Option 1 + Option 2:**

1. Run tests against staging API for regular CI
2. Add Vercel preview testing for PR validation
3. Consider adding mocks (Option 3) for faster smoke tests

**Config updates needed:**

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
  },
  retries: process.env.CI ? 2 : 0,  // Retry flaky tests in CI
  workers: process.env.CI ? 2 : undefined,
});
```

```typescript
// Update tests to use configurable API URL
// tests/e2e/helpers/api.ts
export const API_URL = process.env.API_URL || 'http://localhost:8000';
```

---

## GitHub Secrets Needed

| Secret | Purpose |
|--------|---------|
| `REPO_ACCESS_TOKEN` | Cross-repo access (if using Option 4/5) |
| `STAGING_API_URL` | Staging API endpoint |
| `TEST_USER_EMAIL` | Test account credentials |
| `TEST_USER_PASSWORD` | Test account credentials |
