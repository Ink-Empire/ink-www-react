import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { generateTestZip, cleanupTestFiles } from './utils/test-zip-generator';
import { login, getAuthToken } from './utils/auth';

/**
 * Bulk Upload Performance Tests
 *
 * These tests measure the performance of the bulk upload feature
 * and verify UI responsiveness during large file uploads.
 *
 * Test configurations can be set via environment variables:
 * - TEST_USER_EMAIL: Email for test user login
 * - TEST_USER_PASSWORD: Password for test user login
 * - TEST_IMAGE_COUNT: Number of images to generate (default: 100)
 * - TEST_IMAGE_SIZE: Image size - small|medium|large (default: small)
 * - TEST_BASE_URL: Base URL for the app (default: http://localhost:4000)
 * - TEST_API_URL: Base URL for the API (default: http://localhost:8000/api)
 */

// Test configuration
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'password123',
};

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8000/api';

// Performance metrics storage
interface PerformanceMetrics {
  testName: string;
  imageCount: number;
  imageSize: string;
  zipSizeMB: number;
  uploadTimeMs: number;
  scanTimeMs: number;
  processBatchTimeMs: number;
  uiResponsiveDuringUpload: boolean;
  uiResponsiveDuringScan: boolean;
  thumbnailsRendered: boolean;
  errors: string[];
}

let metrics: PerformanceMetrics;
let testZipPath: string | null = null;
let createdUploadId: number | null = null;

test.describe('Bulk Upload Performance Tests', () => {
  test.beforeAll(async () => {
    // Generate test ZIP file before tests
    const imageCount = parseInt(process.env.TEST_IMAGE_COUNT || '100');
    const imageSize = (process.env.TEST_IMAGE_SIZE as 'small' | 'medium' | 'large') || 'small';

    console.log(`\nGenerating test ZIP with ${imageCount} ${imageSize} images...`);
    testZipPath = await generateTestZip({ imageCount, imageSize });

    const stats = fs.statSync(testZipPath);
    const zipSizeMB = stats.size / (1024 * 1024);

    metrics = {
      testName: `Bulk Upload - ${imageCount} images (${imageSize})`,
      imageCount,
      imageSize,
      zipSizeMB,
      uploadTimeMs: 0,
      scanTimeMs: 0,
      processBatchTimeMs: 0,
      uiResponsiveDuringUpload: false,
      uiResponsiveDuringScan: false,
      thumbnailsRendered: false,
      errors: [],
    };
  });

  test.afterAll(async () => {
    // Print performance report
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE REPORT');
    console.log('='.repeat(60));
    console.log(`Test: ${metrics.testName}`);
    console.log(`ZIP Size: ${metrics.zipSizeMB.toFixed(2)} MB`);
    console.log('-'.repeat(60));
    console.log(`Upload Time: ${(metrics.uploadTimeMs / 1000).toFixed(2)}s`);
    console.log(`Scan Time: ${(metrics.scanTimeMs / 1000).toFixed(2)}s`);
    console.log(`Process Batch Time: ${(metrics.processBatchTimeMs / 1000).toFixed(2)}s`);
    console.log('-'.repeat(60));
    console.log(`UI Responsive During Upload: ${metrics.uiResponsiveDuringUpload ? 'PASS' : 'FAIL'}`);
    console.log(`UI Responsive During Scan: ${metrics.uiResponsiveDuringScan ? 'PASS' : 'FAIL'}`);
    console.log(`Thumbnails Rendered: ${metrics.thumbnailsRendered ? 'PASS' : 'FAIL'}`);
    if (metrics.errors.length > 0) {
      console.log('-'.repeat(60));
      console.log('Errors:');
      metrics.errors.forEach((e) => console.log(`  - ${e}`));
    }
    console.log('='.repeat(60) + '\n');

    // Clean up test files
    cleanupTestFiles();
  });

  test('should login as test user', async ({ page }) => {
    await login(page, TEST_USER);

    // Verify login succeeded
    const loggedIn = await page.locator('.MuiAvatar-root').first().isVisible();
    expect(loggedIn).toBe(true);
  });

  test('should upload ZIP and measure performance', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000); // 10 minute timeout for large uploads

    // Login first
    await login(page, TEST_USER);

    // Navigate to bulk upload page
    await page.goto('/bulk-upload');
    await page.waitForLoadState('networkidle');

    // Verify we're on the bulk upload page
    await expect(page.getByRole('heading', { name: /bulk upload/i })).toBeVisible({
      timeout: 10000,
    });

    // Find the file input and upload
    const fileInput = page.locator('input[type="file"]').first();

    // Ensure ZIP file exists (regenerate if cleaned up from previous run)
    if (!testZipPath || !fs.existsSync(testZipPath)) {
      const imageCount = parseInt(process.env.TEST_IMAGE_COUNT || '100');
      const imageSize = (process.env.TEST_IMAGE_SIZE as 'small' | 'medium' | 'large') || 'small';
      console.log(`\nRegenerating test ZIP (previous was cleaned up)...`);
      testZipPath = await generateTestZip({ imageCount, imageSize });
    }
    expect(testZipPath).toBeTruthy();

    console.log('\nStarting upload measurement...');
    const uploadStartTime = Date.now();

    // Set the file
    await fileInput.setInputFiles(testZipPath!);

    // Test UI responsiveness during upload - try to interact with page
    const uiTestDuringUpload = async () => {
      try {
        // Try hovering over elements to verify UI is responsive
        const anyButton = page.locator('button').first();
        if (await anyButton.isVisible()) {
          await anyButton.hover({ timeout: 1000 });
          metrics.uiResponsiveDuringUpload = true;
        }
      } catch {
        metrics.uiResponsiveDuringUpload = false;
      }
    };

    // Check UI responsiveness periodically during upload
    const uiCheckInterval = setInterval(uiTestDuringUpload, 2000);

    // Wait for upload to complete - page stays here and shows success message
    try {
      // Wait for success message to appear (indicates upload was received)
      await page.waitForSelector('text=Upload received', { timeout: 120000 });
      metrics.uploadTimeMs = Date.now() - uploadStartTime;
      console.log(`Upload completed in ${(metrics.uploadTimeMs / 1000).toFixed(2)}s`);

      // Wait for uploads list to refresh and show the new upload
      await page.waitForTimeout(2000); // Give time for list to refresh

      // Find and click on the first upload card to navigate to detail page
      const uploadCard = page.locator('[class*="Card"]').filter({ hasText: /scanning|cataloged|processing/i }).first();
      if (await uploadCard.isVisible({ timeout: 10000 })) {
        // Get the upload ID from the card's click handler or navigate
        await uploadCard.click();
        await page.waitForURL(/\/bulk-upload\/\d+/, { timeout: 10000 });

        // Extract upload ID from URL
        const url = page.url();
        const match = url.match(/\/bulk-upload\/(\d+)/);
        if (match) {
          createdUploadId = parseInt(match[1]);
          console.log(`Created upload ID: ${createdUploadId}`);
        }
      } else {
        console.log('Warning: Could not find upload card to click');
      }
    } catch (error) {
      metrics.errors.push(`Upload timed out or failed: ${error}`);
      clearInterval(uiCheckInterval);
      throw error;
    }

    clearInterval(uiCheckInterval);

    // Now measure scan time
    console.log('\nMeasuring scan time...');
    const scanStartTime = Date.now();

    // Test UI responsiveness during scan
    const uiTestDuringScan = async () => {
      try {
        const refreshButton = page.locator('button:has-text("Refresh"), [aria-label="Refresh"]').first();
        if (await refreshButton.isVisible()) {
          await refreshButton.hover({ timeout: 500 });
          metrics.uiResponsiveDuringScan = true;
        }
      } catch {
        // UI might be busy
      }
    };

    const scanCheckInterval = setInterval(uiTestDuringScan, 3000);

    // Wait for scanning to complete - look for status change
    try {
      await page.waitForFunction(
        () => {
          const statusChip = document.querySelector('[class*="Chip"]');
          const statusText = statusChip?.textContent?.toLowerCase() || '';
          return !statusText.includes('scanning');
        },
        { timeout: 300000 } // 5 minutes for scanning
      );
      metrics.scanTimeMs = Date.now() - scanStartTime;
      console.log(`Scan completed in ${(metrics.scanTimeMs / 1000).toFixed(2)}s`);
    } catch (error) {
      metrics.scanTimeMs = Date.now() - scanStartTime;
      metrics.errors.push(`Scan may have timed out: ${error}`);
    }

    clearInterval(scanCheckInterval);

    // Check if thumbnails are rendered
    await page.waitForTimeout(2000); // Give thumbnails time to render
    const thumbnails = page.locator('img[src*="s3"], img[src*="amazonaws"]');
    const thumbnailCount = await thumbnails.count();
    metrics.thumbnailsRendered = thumbnailCount > 0;
    console.log(`Thumbnails rendered: ${thumbnailCount}`);

    // Measure process batch time if applicable
    const processButton = page.locator('button:has-text("Process")').first();
    if (await processButton.isVisible() && await processButton.isEnabled()) {
      console.log('\nMeasuring process batch time...');
      const processStartTime = Date.now();

      await processButton.click();

      // Wait for processing to start and complete (or timeout)
      try {
        await page.waitForFunction(
          () => {
            const statusChip = document.querySelector('[class*="Chip"]');
            const statusText = statusChip?.textContent?.toLowerCase() || '';
            return !statusText.includes('processing');
          },
          { timeout: 300000 } // 5 minutes for processing
        );
        metrics.processBatchTimeMs = Date.now() - processStartTime;
        console.log(`Process batch completed in ${(metrics.processBatchTimeMs / 1000).toFixed(2)}s`);
      } catch {
        metrics.processBatchTimeMs = Date.now() - processStartTime;
        metrics.errors.push('Process batch may have timed out');
      }
    }
  });

  test('should cleanup test upload', async ({ page, request }) => {
    if (!createdUploadId) {
      console.log('No upload to clean up');
      return;
    }

    // Login to get auth token
    await login(page, TEST_USER);
    const token = await getAuthToken(page);

    if (!token) {
      console.log('Warning: Could not get auth token for cleanup');
      return;
    }

    console.log(`\nCleaning up upload ${createdUploadId}...`);

    try {
      // Delete the upload via API
      const response = await request.delete(`${API_BASE_URL}/bulk-uploads/${createdUploadId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok()) {
        console.log('Upload deleted successfully');
      } else {
        console.log(`Warning: Delete returned status ${response.status()}`);
      }
    } catch (error) {
      console.log(`Warning: Cleanup error: ${error}`);
    }
  });
});

// Additional test for UI responsiveness specifically
test.describe('UI Responsiveness Tests', () => {
  test('should remain interactive during large file selection', async ({ page }) => {
    // This test specifically checks that the UI doesn't freeze
    // when selecting a large file

    await login(page, TEST_USER);
    await page.goto('/bulk-upload');
    await page.waitForLoadState('networkidle');

    // Create a smaller test zip for this quick test
    const quickTestZip = await generateTestZip({ imageCount: 50, imageSize: 'small' });

    const fileInput = page.locator('input[type="file"]').first();

    // Set up a concurrent interaction test
    let interactionSucceeded = false;

    const interactionPromise = (async () => {
      await page.waitForTimeout(500); // Small delay to let upload start
      try {
        // Try to interact with the page
        const anyElement = page.locator('body');
        await anyElement.hover();
        interactionSucceeded = true;
      } catch {
        interactionSucceeded = false;
      }
    })();

    // Start the file upload
    await fileInput.setInputFiles(quickTestZip);

    // Wait for interaction test to complete
    await interactionPromise;

    expect(interactionSucceeded).toBe(true);

    // Clean up
    fs.unlinkSync(quickTestZip);
  });
});
