import { test, expect } from '@playwright/test';

test.describe('HAL Explorer App', () => {

  const expectResponseDetailsAreDisplayed = async (page) => {
    await expect(page.locator('h5:has-text("Response Status")')).toBeVisible();
    await expect(page.locator('h5:has-text("Response Headers")')).toBeVisible();
    await expect(page.locator('h5:has-text("Response Body")')).toBeVisible();
  };

  test('Visits the initial HAL Explorer page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.navbar-brand')).toContainText('HAL Explorer');
    await expect(page.locator('nav .navbar-nav a.nav-link', { hasText: 'Theme' })).toBeVisible();
    await expect(page.locator('nav .navbar-nav a.nav-link', { hasText: 'Settings' })).toBeVisible();
    await expect(page.locator('nav .navbar-nav a.nav-link', { hasText: 'About' })).toBeVisible();
    await expect(page.locator('button.btn.btn-secondary', { hasText: 'Edit Headers' })).toBeVisible();
    await expect(page.locator('button.btn.btn-primary', { hasText: 'Go!' })).toBeVisible();
  });

  test('should have title "HAL Explorer"', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('HAL Explorer');
  });

  test('should display "Edit Headers" as button text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button.btn.btn-secondary', { hasText: 'Edit Headers' })).toBeVisible();
  });

  test('should not display HAL sections at startup', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h5:has-text("JSON Properties")')).not.toBeVisible();
    await expect(page.locator('h5:has-text("Links")')).not.toBeVisible();
    await expect(page.locator('h5:has-text("Embedded Resources")')).not.toBeVisible();
    await expect(page.locator('h5:has-text("Response Status")')).not.toBeVisible();
    await expect(page.locator('h5:has-text("Response Headers")')).not.toBeVisible();
    await expect(page.locator('h5:has-text("Response Body")')).not.toBeVisible();
  });

  test('should display HAL sections when rendering users resource', async ({ page }) => {
    await page.goto('/#uri=http://localhost:3000/movies.hal-forms.json');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h5:has-text("JSON Properties")').first()).toBeVisible();
    await expect(page.locator('h5:has-text("Links")').first()).toBeVisible();
    await expect(page.locator('h5:has-text("HAL-FORMS Template Elements")')).toBeVisible();
    await expect(page.locator('h5:has-text("Embedded Resources")')).toBeVisible();

    await expectResponseDetailsAreDisplayed(page);
  });

  test('should display only Links section when rendering root api', async ({ page }) => {
    await page.goto('/#uri=http://localhost:3000/index.hal.json');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text="JSON Properties"').first()).not.toBeVisible();
    await expect(page.locator('text="Embedded Resources"').first()).not.toBeVisible();
    await expect(page.locator('h5:has-text("Links")').first()).toBeVisible();

    await expectResponseDetailsAreDisplayed(page);
  });

  test('should display POST request dialog', async ({ page }) => {
    await page.goto('/#uri=http://localhost:3000/movies.hal-forms.json');
    await page.waitForLoadState('networkidle');
    await page.locator('button.icon-plus').nth(3).click();
    await expect(page.getByText('HTTP Request Input')).toBeVisible();
  });

  test('should display user profile in POST request dialog', async ({ page }) => {
    await page.goto('/#uri=http://localhost:3000/index.hal.json');
    await page.waitForLoadState('networkidle');
    await page.locator('button.icon-plus').nth(0).click();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Full name')).toBeVisible();
    await expect(page.getByText('Id')).toBeVisible();
  });

  test('should display expanded URI in HAL-FORMS GET request dialog', async ({ page }) => {
    await page.goto('/#uri=http://localhost:3000/filter.hal-forms.json');
    await page.waitForLoadState('networkidle');
    await page.locator('button.icon-left-open').last().click();

    await page.locator('input[id="request-input-title"]').fill('myTitle');
    await page.locator('input[id="request-input-completed"]').fill('true');
    // Trigger change event by pressing Tab or clicking elsewhere
    await page.locator('input[id="request-input-completed"]').press('Tab');

    // Wait a bit for the URI to update
    await page.waitForTimeout(500);

    await expect(page.locator('[id="request-input-expanded-uri"]'))
      .toContainText('title=myTitle');
  });

  test('should display correct properties HAL-FORMS POST request dialog', async ({ page }) => {
    await page.goto('/#uri=http://localhost:3000/2posts1get.hal-forms.json');
    await page.waitForLoadState('networkidle');

    // Click the first POST button (Post 1 template)
    await page.locator('button.icon-plus').last().click();

    // Verify the HTTP Request Input modal opens
    await expect(page.getByText('HTTP Request Input')).toBeVisible();

    // Verify the label with title "POST 2" is visible (proves correct template loaded)
    await expect(page.locator('label[title="post2"]')).toBeVisible();
  });

});

