import type { Page } from '@playwright/test';

/**
 * Wait for the Astro toolbar to load on the page.
 * Extracted in case we need to change the selector.
 */
export async function waitForAstroToolbar(page: Page) {
  return page.waitForSelector('#dev-overlay');
}
