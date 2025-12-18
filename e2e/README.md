# E2E Tests with Playwright

This directory contains end-to-end tests using [Playwright](https://playwright.dev/).

## Running Tests

### Run all tests (headless)
```bash
yarn e2e
```

### Run tests with UI mode (recommended for development)
```bash
yarn e2e:ui
```

### Run tests in headed mode (see the browser)
```bash
yarn e2e:headed
```

### Run tests in debug mode
```bash
yarn e2e:debug
```

### Run tests for specific browser
```bash
yarn e2e:chromium
yarn e2e:firefox
yarn e2e:webkit
```

### View test report
```bash
yarn e2e:report
```

## Test Structure

Tests are located in the `e2e/` directory with the `.spec.ts` extension.

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the project.

## Writing Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Hello')).toBeVisible();
  });
});
```

For more information, visit the [Playwright documentation](https://playwright.dev/docs/intro).

