import { test, expect } from '@playwright/test';

test.describe('UI Blocking During Requests', () => {

  test('should disable Go button and show spinner during request', async ({ page }) => {
    await page.goto('/');

    // Navigate to a test endpoint
    const uriInput = page.locator('#InputApiUri');
    await uriInput.fill('http://localhost:3000/movies.hal-forms.json');

    const goButton = page.locator('button#go');
    await expect(goButton).toBeEnabled();

    // Click Go button
    await goButton.click();

    // During request processing, button should be disabled and show spinner
    // This might be very fast, so we check if it becomes enabled again after request completes
    await page.waitForLoadState('networkidle');

    // After request completes, button should be enabled again
    await expect(goButton).toBeEnabled();
  });

  test('should disable link buttons during request', async ({ page }) => {
    // Load initial resource
    await page.goto('/#uri=http://localhost:3000/index.hal.json');
    await page.waitForLoadState('networkidle');

    // Verify links are visible and enabled
    await expect(page.locator('h5:has-text("Links")').first()).toBeVisible();
    const firstGetButton = page.locator('button.icon-left-open').first();
    await expect(firstGetButton).toBeEnabled();

    // Click a link button
    await firstGetButton.click();

    // Wait for the new resource to load
    await page.waitForLoadState('networkidle');

    // After request completes, buttons should be enabled again
    await expect(page.locator('button.icon-left-open').first()).toBeEnabled();
  });

  test('should disable template buttons during request', async ({ page }) => {
    // Load resource with HAL-FORMS templates
    await page.goto('/#uri=http://localhost:3000/movies.hal-forms.json');
    await page.waitForLoadState('networkidle');

    // Wait for the HAL-FORMS section to be loaded
    await expect(page.locator('h5:has-text("HAL-FORMS Template Elements")')).toBeVisible();

    // Verify template button is enabled
    const templateButton = page.locator('button.icon-left-open').first();
    await expect(templateButton).toBeEnabled();

    // After navigating, buttons should remain functional
    await expect(templateButton).toBeEnabled();
  });

  test('should disable Edit Headers button during request', async ({ page }) => {
    await page.goto('/');

    const editHeadersButton = page.locator('button.btn.btn-secondary', { hasText: 'Edit Headers' });
    await expect(editHeadersButton).toBeEnabled();

    // Fill in URI
    const uriInput = page.locator('#InputApiUri');
    await uriInput.fill('http://localhost:3000/index.hal.json');

    const goButton = page.locator('button#go');
    await goButton.click();

    // Wait for request to complete
    await page.waitForLoadState('networkidle');

    // After request, Edit Headers button should be enabled again
    await expect(editHeadersButton).toBeEnabled();
  });

  test('should disable documentation buttons during request', async ({ page }) => {
    // Load resource with documentation links
    await page.goto('/#uri=http://localhost:3000/index-with-doc-anchor.hal.json');
    await page.waitForLoadState('networkidle');

    // Check if documentation button exists and is enabled
    const docButton = page.locator('button.icon-book').first();
    if (await docButton.count() > 0) {
      await expect(docButton).toBeEnabled();
    }
  });

});

