import { test, expect } from '@playwright/test';

test.describe('Comic Book Resume - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to render
    await page.waitForSelector('.app-container', { timeout: 10000 });
  });

  test('app loads and renders cover page', async ({ page }) => {
    // App container exists
    await expect(page.locator('.app-container')).toBeVisible();
    // Comic wrapper exists
    await expect(page.locator('.comic-wrapper')).toBeVisible();
    // Click hint shows on cover
    await expect(page.locator('.click-hint')).toBeVisible();
  });

  test('cover page has essential content', async ({ page }) => {
    // Check for hero name or title text
    const pageContent = await page.textContent('.app-container');
    expect(pageContent).toContain('Shawn');
  });

  test('clicking the book opens it', async ({ page }) => {
    // Click on the comic wrapper to open the book
    await page.locator('.comic-wrapper').click();
    // Wait for open state
    await page.waitForTimeout(1500);
    // Keyboard hints should appear when book is open
    const keyboardHints = page.locator('.keyboard-hints');
    await expect(keyboardHints).toBeVisible({ timeout: 5000 });
    // Click hint should disappear
    await expect(page.locator('.click-hint')).not.toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    // Open the book first
    await page.locator('.comic-wrapper').click();
    await page.waitForTimeout(1500);

    // Get initial page indicator text
    const indicator = page.locator('.page-indicator');
    await expect(indicator).toBeVisible({ timeout: 5000 });
    const initialText = await indicator.textContent();

    // Press right arrow to flip page
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);

    // Page indicator should have changed
    const newText = await indicator.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForSelector('.app-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Filter out known benign errors (e.g., favicon)
    const realErrors = errors.filter(e => !e.includes('favicon'));
    expect(realErrors).toHaveLength(0);
  });

  test('pages render without crashing after multiple flips', async ({ page }) => {
    // Open book
    await page.locator('.comic-wrapper').click();
    await page.waitForTimeout(1500);

    // Flip through several pages
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
    }

    // App should still be functioning
    await expect(page.locator('.app-container')).toBeVisible();
    const indicator = page.locator('.page-indicator');
    await expect(indicator).toBeVisible();
  });
});
