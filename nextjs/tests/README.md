# InkedIn E2E Tests

End-to-end tests for InkedIn using [Playwright](https://playwright.dev/).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Configure test environment:
   ```bash
   cp tests/e2e/.env.test.example tests/e2e/.env.test
   # Edit .env.test with your test credentials
   ```

## Running Tests

### All E2E Tests
```bash
npm run test:e2e           # Headless
npm run test:e2e:headed    # With browser visible
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:debug     # Debug mode with inspector
```

### Bulk Upload Performance Tests

These tests measure the performance of the bulk upload feature with various load sizes.

```bash
# Quick test with 50 small images
npm run test:bulk-upload:small

# Medium test with 200 images
npm run test:bulk-upload:medium

# Large test with 500 images
npm run test:bulk-upload:large

# Stress test with 1000 medium-sized images
npm run test:bulk-upload:stress
```

### Custom Configuration

You can customize tests with environment variables:

```bash
# Custom image count and size
TEST_IMAGE_COUNT=300 TEST_IMAGE_SIZE=medium npm run test:bulk-upload

# Against production (careful!)
TEST_BASE_URL=https://www.getinked.in TEST_API_URL=https://api.getinked.in/api npm run test:bulk-upload
```

### Generate Test ZIP Only

To generate a test ZIP file without running tests:

```bash
npm run test:generate-zip -- 100 small   # 100 small images
npm run test:generate-zip -- 500 medium  # 500 medium images
```

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

Reports are saved in `tests/reports/`.

## What the Performance Tests Measure

| Metric | Description |
|--------|-------------|
| Upload Time | Time from file selection to upload completion |
| Scan Time | Time for backend to scan and catalog ZIP contents |
| Process Batch Time | Time to process a batch of images |
| UI Responsive (Upload) | Whether UI remains interactive during upload |
| UI Responsive (Scan) | Whether UI remains interactive during scanning |
| Thumbnails Rendered | Whether image thumbnails successfully render |

## Test Structure

```
tests/
├── e2e/
│   ├── bulk-upload-performance.spec.ts  # Main performance tests
│   ├── utils/
│   │   ├── auth.ts                      # Login/logout helpers
│   │   └── test-zip-generator.ts        # Test ZIP file generator
│   └── .env.test.example                # Environment template
├── temp/                                 # Temporary test files (gitignored)
├── reports/                              # Test reports (gitignored)
└── README.md                             # This file
```

## Cleanup

Tests automatically clean up:
- Generated test ZIP files
- Uploaded bulk uploads (via API delete)

If cleanup fails, you can manually delete test uploads from the admin panel or database.

## Troubleshooting

### "Test user login failed"
- Ensure test user exists in your database
- Check TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test

### "Upload timed out"
- Increase timeout in playwright.config.ts
- Check that your dev server is running
- Verify network connectivity

### "Cannot find module 'archiver'"
- Run `npm install` to ensure all dev dependencies are installed

### Tests are slow
- Use smaller TEST_IMAGE_COUNT for quick validation
- Use TEST_IMAGE_SIZE=small for faster ZIP generation
