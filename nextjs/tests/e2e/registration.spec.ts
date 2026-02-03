import { test, expect, Page } from '@playwright/test';

/**
 * Registration Flow E2E Tests
 *
 * Tests the complete registration/onboarding flow for all user types:
 * - Tattoo Enthusiast (client)
 * - Tattoo Artist
 * - Tattoo Studio
 *
 * API requests are mocked by MSW (Mock Service Worker), which is enabled
 * automatically when NEXT_PUBLIC_MSW_ENABLED=true.
 *
 * Test configuration via environment variables:
 * - TEST_BASE_URL: Base URL for the app (default: http://localhost:4000)
 */

// Generate unique test data for each run to avoid conflicts
const generateTestEmail = (prefix: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${random}@test.example.com`;
};

const generateTestUsername = (prefix: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${random}`;
};

// Test data generators
const createTestUser = (type: 'client' | 'artist' | 'studio') => ({
  name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
  username: generateTestUsername(`test_${type}`),
  email: generateTestEmail(`test_${type}`),
  password: 'TestPassword123!',
  bio: `This is a test bio for the ${type} registration flow.`,
  location: 'New York, NY, USA',
});

test.describe('Registration Flow Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // MSW handles all API mocking automatically

    // Grant geolocation permissions and mock location
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 }); // New York

    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for the wizard to be visible
    await expect(page.getByRole('heading', { name: 'Welcome to InkedIn' })).toBeVisible({ timeout: 10000 });
  });

  test.describe('Tattoo Enthusiast Registration', () => {
    test('should complete beginner enthusiast registration flow', async ({ page }) => {
      const testUser = createTestUser('client');

      // Step 1: Select user type - Tattoo Enthusiast
      await page.getByRole('heading', { name: 'Tattoo Enthusiast' }).click();
      await expect(page.getByRole('heading', { name: 'Your Tattoo Experience' })).toBeVisible({ timeout: 5000 });

      // Step 2: Select experience level - Beginner
      await page.getByRole('heading', { name: 'New to Tattoos' }).click();

      // Step 3: Select styles - for clients it shows "What tattoo styles interest you?"
      await expect(page.getByRole('heading', { name: 'What tattoo styles interest you?' })).toBeVisible({ timeout: 5000 });

      // Click Skip for now (or select a style and continue)
      await page.getByRole('button', { name: 'Skip for now' }).click();

      // Step 4: User Details - for clients it's "Create your profile"
      await expect(page.getByRole('heading', { name: 'Create your profile' })).toBeVisible({ timeout: 5000 });

      // Fill in the form using labeled fields (clients don't have Bio field)
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(testUser.name);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);

      // Location is required - use geolocation
      const useMyLocationBtn = page.getByRole('button', { name: 'Use my location' });
      await useMyLocationBtn.click();
      // Wait for location to be resolved - look for the location text
      await expect(page.getByRole('button', { name: 'Enter manually' })).toBeVisible({ timeout: 5000 });
      // Wait for location text to actually appear
      await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Click continue
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 5: Tattoo Intent (Plans) - skip it
      await page.waitForTimeout(1000);
      const skipBtn = page.getByRole('button', { name: /skip|not sure|continue/i });
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
      }

      // Step 6: Account Setup
      await expect(page.getByRole('heading', { name: /set up your account/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Email Address' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(testUser.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(testUser.password);

      // Wait for email availability check
      await page.waitForTimeout(1500);

      // Submit registration
      const createAccountBtn = page.getByRole('button', { name: 'Create Account' });
      await expect(createAccountBtn).toBeEnabled({ timeout: 5000 });
      await createAccountBtn.click();

      // Should redirect to verify email page (API is mocked to succeed)
      await page.waitForURL(/verify-email/, { timeout: 15000 });
      await expect(page.getByText('Verify your email to start')).toBeVisible();
    });

    test('should complete experienced enthusiast registration flow', async ({ page }) => {
      const testUser = createTestUser('client');

      // Step 1: Select user type - Tattoo Enthusiast
      await page.getByRole('heading', { name: 'Tattoo Enthusiast' }).click();

      // Step 2: Select experience level - Experienced
      await page.getByRole('heading', { name: 'Experienced Collector' }).click();
      await expect(page.getByRole('heading', { name: 'What tattoo styles interest you?' })).toBeVisible({ timeout: 5000 });

      // Skip style selection
      await page.getByRole('button', { name: 'Skip for now' }).click();

      // Fill user details - for clients it's "Create your profile"
      await expect(page.getByRole('heading', { name: 'Create your profile' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(testUser.name);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);

      // Location is required - use geolocation
      const useMyLocationBtn = page.getByRole('button', { name: 'Use my location' });
      await useMyLocationBtn.click();
      // Wait for location to be resolved - look for the location text
      await expect(page.getByRole('button', { name: 'Enter manually' })).toBeVisible({ timeout: 5000 });
      // Wait for location text to actually appear
      await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Continue' }).click();

      // Skip tattoo intent
      await page.waitForTimeout(500);
      const skipBtn = page.getByRole('button', { name: /skip|continue/i });
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
      }

      // Account setup
      await expect(page.getByRole('heading', { name: /set up your account/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Email Address' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(testUser.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(testUser.password);

      await page.waitForTimeout(1500);
      const createAccountBtn = page.getByRole('button', { name: 'Create Account' });
      await expect(createAccountBtn).toBeEnabled({ timeout: 5000 });
      await createAccountBtn.click();

      // Should redirect to verify email page (API is mocked to succeed)
      await page.waitForURL(/verify-email/, { timeout: 15000 });
    });
  });

  test.describe('Tattoo Artist Registration', () => {
    test('should complete artist registration flow', async ({ page }) => {
      const testUser = createTestUser('artist');

      // Step 1: Select user type - Tattoo Artist
      await page.getByRole('heading', { name: 'Tattoo Artist' }).click();

      // Step 2: Specialties (styles selection)
      await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });

      // Click Skip for now
      await page.getByRole('button', { name: 'Skip for now' }).click();

      // Step 3: User Details (Profile) - heading is "Tell us about yourself"
      await expect(page.getByRole('heading', { name: 'Tell us about yourself' })).toBeVisible({ timeout: 5000 });

      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(testUser.name);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Bio' }).fill(testUser.bio);

      // Location is required - use geolocation
      const useMyLocationBtn = page.getByRole('button', { name: 'Use my location' });
      await useMyLocationBtn.click();
      // Wait for location to be resolved - look for the location text
      await expect(page.getByRole('button', { name: 'Enter manually' })).toBeVisible({ timeout: 5000 });
      // Wait for location text to actually appear
      await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 4: Account Setup
      await expect(page.getByRole('heading', { name: /set up your.*account/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Email Address' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(testUser.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(testUser.password);

      await page.waitForTimeout(1500);
      const createAccountBtn = page.getByRole('button', { name: 'Create Account' });
      await expect(createAccountBtn).toBeEnabled({ timeout: 5000 });
      await createAccountBtn.click();

      // Should redirect to verify email page (API is mocked to succeed)
      await page.waitForURL(/verify-email/, { timeout: 15000 });
      await expect(page.getByText('Verify your email to start')).toBeVisible();
    });

    test('should show artist-specific fields during registration', async ({ page }) => {
      // Step 1: Select user type - Tattoo Artist
      await page.getByRole('heading', { name: 'Tattoo Artist' }).click();

      // Verify we see artist-specific styles selection
      await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });

      // Verify skip and continue buttons exist
      await expect(page.getByRole('button', { name: 'Skip for now' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();

      // Navigate to profile step
      await page.getByRole('button', { name: 'Skip for now' }).click();

      // Verify profile section is visible with artist-specific elements
      await expect(page.getByRole('heading', { name: 'Tell us about yourself' })).toBeVisible({ timeout: 5000 });

      // Artists should see Studio Affiliation option
      await expect(page.getByRole('heading', { name: /Studio Affiliation/i })).toBeVisible();
    });
  });

  test.describe('Tattoo Studio Registration', () => {
    test('should complete new studio owner registration flow', async ({ page }) => {
      const testUser = createTestUser('studio');

      // Step 1: Select user type - Tattoo Studio
      await page.getByRole('heading', { name: 'Tattoo Studio' }).click();
      await expect(page.getByRole('heading', { name: 'Studio Owner Account' })).toBeVisible({ timeout: 5000 });

      // Step 2: Studio Owner Check - No existing account
      await page.getByRole('heading', { name: "No, I'm new here" }).click();

      // Step 3: Studio Details - first see the search or manual entry
      await expect(page.getByRole('heading', { name: 'Tell us about your studio' })).toBeVisible({ timeout: 5000 });

      // Look for "enter manually" button if studio search is shown first
      const manualEntryBtn = page.getByRole('button', { name: /enter.*manually|manual/i });
      if (await manualEntryBtn.isVisible()) {
        await manualEntryBtn.click();
      }

      // Fill studio details
      await page.getByRole('textbox', { name: 'Studio Name' }).fill(`Test Studio ${testUser.username}`);
      await page.getByRole('textbox', { name: 'Studio Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Studio Bio' }).fill(testUser.bio);

      // Location - use geolocation if available
      const useMyLocationBtn = page.getByRole('button', { name: 'Use my location' });
      if (await useMyLocationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await useMyLocationBtn.click();
        await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(500);
      }

      await page.getByRole('textbox', { name: 'Studio Email' }).fill(testUser.email);

      // Password fields (they're textboxes with toggle visibility)
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(testUser.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(testUser.password);

      await page.waitForTimeout(1500);

      // Submit studio registration
      const createStudioBtn = page.getByRole('button', { name: 'Create Studio' });
      await expect(createStudioBtn).toBeEnabled({ timeout: 5000 });
      await createStudioBtn.click();

      // Should redirect to verify email page (API is mocked to succeed)
      await page.waitForURL(/verify-email/, { timeout: 15000 });
    });

    test('should show existing account login option for studio', async ({ page }) => {
      // Step 1: Select user type - Tattoo Studio
      await page.getByRole('heading', { name: 'Tattoo Studio' }).click();
      await expect(page.getByRole('heading', { name: 'Studio Owner Account' })).toBeVisible({ timeout: 5000 });

      // Step 2: Studio Owner Check - Has existing account
      await page.getByRole('heading', { name: 'Yes, I have an account' }).click();

      // Should show login form
      await expect(page.getByRole('heading', { name: /Log In/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
    });
  });

  test.describe('Navigation and Validation', () => {
    test('should allow navigation back through wizard steps', async ({ page }) => {
      // Start registration as enthusiast
      await page.getByRole('heading', { name: 'Tattoo Enthusiast' }).click();
      await expect(page.getByRole('heading', { name: 'Your Tattoo Experience' })).toBeVisible();

      // Click back button
      await page.getByRole('button', { name: 'Back' }).click();

      // Should be back at user type selection
      await expect(page.getByRole('heading', { name: 'Welcome to InkedIn' })).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      const testUser = createTestUser('artist');

      // Navigate to account setup step (artist flow is shortest)
      await page.getByRole('heading', { name: 'Tattoo Artist' }).click();
      await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'Skip for now' }).click();

      // Fill profile
      await expect(page.getByRole('heading', { name: 'Tell us about yourself' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(testUser.name);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Bio' }).fill(testUser.bio);

      // Location is required - use geolocation
      await page.getByRole('button', { name: 'Use my location' }).click();
      await expect(page.getByRole('button', { name: 'Enter manually' })).toBeVisible({ timeout: 5000 });
      // Wait for location text to actually appear (e.g., "New York, New York, US")
      await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Continue' }).click();

      // Account setup - enter invalid email
      await expect(page.getByRole('heading', { name: /set up your.*account/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Email Address' }).fill('invalid-email');
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(testUser.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(testUser.password);

      // Try to submit - button should be disabled or show error
      const createAccountBtn = page.getByRole('button', { name: 'Create Account' });

      // Wait and check - invalid email should either disable button or show error indicator
      await page.waitForTimeout(500);
      const isDisabled = await createAccountBtn.isDisabled();

      if (!isDisabled) {
        // If button is enabled, clicking should show validation error
        await createAccountBtn.click();
        await page.waitForTimeout(500);
        // Check we're still on the same page (form didn't submit)
        await expect(createAccountBtn).toBeVisible();
      }
      // Either button was disabled or clicking showed error - both are valid
    });

    test('should validate password requirements', async ({ page }) => {
      const testUser = createTestUser('artist');

      // Navigate to account setup
      await page.getByRole('heading', { name: 'Tattoo Artist' }).click();
      await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'Skip for now' }).click();

      await expect(page.getByRole('heading', { name: 'Tell us about yourself' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(testUser.name);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Bio' }).fill(testUser.bio);

      // Location is required - use geolocation
      await page.getByRole('button', { name: 'Use my location' }).click();
      await expect(page.getByRole('button', { name: 'Enter manually' })).toBeVisible({ timeout: 5000 });
      // Wait for location text to actually appear
      await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Continue' }).click();

      // Account setup - enter weak password
      await expect(page.getByRole('heading', { name: /set up your.*account/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Email Address' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill('weak');
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill('weak');

      // Wait for password validation to show
      await page.waitForTimeout(500);

      // The create button should be disabled for weak passwords
      const createAccountBtn = page.getByRole('button', { name: 'Create Account' });
      const isDisabled = await createAccountBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('should validate password confirmation match', async ({ page }) => {
      const testUser = createTestUser('artist');

      // Navigate to account setup
      await page.getByRole('heading', { name: 'Tattoo Artist' }).click();
      await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'Skip for now' }).click();

      await expect(page.getByRole('heading', { name: 'Tell us about yourself' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(testUser.name);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Bio' }).fill(testUser.bio);

      // Location is required - use geolocation
      await page.getByRole('button', { name: 'Use my location' }).click();
      await expect(page.getByRole('button', { name: 'Enter manually' })).toBeVisible({ timeout: 5000 });
      // Wait for location text to actually appear
      await expect(page.getByText(/New York/i)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Continue' }).click();

      // Account setup - mismatched passwords
      await expect(page.getByRole('heading', { name: /set up your.*account/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('textbox', { name: 'Email Address' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(testUser.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill('DifferentPassword123!');

      // Should show mismatch indicator
      await page.waitForTimeout(500);
      await expect(page.getByText(/do not match|don't match/i)).toBeVisible();
    });

    test('should allow cancel during registration', async ({ page }) => {
      // Start registration
      await expect(page.getByRole('heading', { name: 'Welcome to InkedIn' })).toBeVisible();

      // Look for cancel button
      const cancelBtn = page.getByRole('button', { name: 'Cancel' });
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();

      // Should redirect to home
      await page.waitForURL('/', { timeout: 5000 });
    });
  });

  test.describe('User Type Selection UI', () => {
    test('should display all three user type options', async ({ page }) => {
      // Verify all three options are visible (h3 headings)
      await expect(page.getByRole('heading', { name: 'Tattoo Enthusiast', level: 3 })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Tattoo Artist', level: 3 })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Tattoo Studio', level: 3 })).toBeVisible();
    });

    test('should show descriptions for each user type', async ({ page }) => {
      // Verify descriptions are present
      await expect(page.getByText(/looking for inspiration/i)).toBeVisible();
      await expect(page.getByText(/create tattoos/i)).toBeVisible();
      await expect(page.getByText(/represent a studio/i)).toBeVisible();
    });

    test('should have clickable user type cards', async ({ page }) => {
      // Click on a user type card
      await page.getByRole('heading', { name: 'Tattoo Enthusiast' }).click();

      // Should navigate to next step
      await expect(page.getByRole('heading', { name: 'Your Tattoo Experience' })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Progress Indicator', () => {
    test('should show progress bar during registration', async ({ page }) => {
      // Look for progress bar (use first to handle multiple progressbar elements)
      const progressBar = page.locator('.MuiLinearProgress-root').first();
      await expect(progressBar).toBeVisible();
    });

    test('should update progress as user advances through steps', async ({ page }) => {
      // Advance to next step
      await page.getByRole('heading', { name: 'Tattoo Artist' }).click();

      // Progress should be visible (linear progress bar)
      await expect(page.locator('.MuiLinearProgress-root').first()).toBeVisible();

      // Should see step 2 (Specialties)
      await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });
    });
  });
});

// Mobile-specific tests
test.describe('Mobile Registration Flow', () => {
  test.use({
    viewport: { width: 375, height: 812 }, // iPhone X viewport
    hasTouch: true, // Enable touch events
  });

  test('should be usable on mobile devices', async ({ page, context }) => {
    // MSW handles all API mocking automatically

    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Verify mobile step indicator is shown (shows "Step X of Y")
    await expect(page.getByText(/Step 1 of \d+/i)).toBeVisible({ timeout: 5000 });

    // Verify user type cards are visible and tappable
    await expect(page.getByRole('heading', { name: 'Tattoo Enthusiast' })).toBeVisible();

    // Tap on a user type
    await page.getByRole('heading', { name: 'Tattoo Enthusiast' }).tap();
    await expect(page.getByRole('heading', { name: 'Your Tattoo Experience' })).toBeVisible();

    // Verify buttons are accessible on mobile
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('should handle mobile keyboard for form inputs', async ({ page, context }) => {
    const testUser = createTestUser('artist');

    // MSW handles all API mocking automatically

    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Navigate to a form step
    await page.getByRole('heading', { name: 'Tattoo Artist' }).tap();
    await expect(page.getByRole('heading', { name: 'What styles do you specialize in?' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Skip for now' }).tap();

    // Wait for form to be visible
    await expect(page.getByRole('heading', { name: 'Tell us about yourself' })).toBeVisible({ timeout: 5000 });

    // Focus on input should work
    const nameInput = page.getByRole('textbox', { name: 'Name', exact: true });
    await nameInput.tap();
    await nameInput.fill(testUser.name);

    // Verify input was filled
    await expect(nameInput).toHaveValue(testUser.name);
  });
});
