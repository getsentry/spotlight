import { expect, test } from '@playwright/test';
import { waitForAstroToolbar } from './utils/test-utils';

const ASTRO_TOOLBAR_SPOTLIGHT_BTN = 'button[data-plugin-id="spotlight-plugin"]';

test('has Astro Dev Toolbar and Spotlight toolbar app', async ({ page }) => {
  await page.goto('http://localhost:4321');

  await expect(page).toHaveTitle(/Astro/);

  await waitForAstroToolbar(page);

  const toolbarVisible = await page.isVisible('#dev-overlay');
  expect(toolbarVisible).toBe(true);
});

test('Astro dev toolbar has spotlight button', async ({ page }) => {
  await page.goto('http://localhost:4321');
  await waitForAstroToolbar(page);

  const spotlightToolbarButtonVisible = await page.isVisible(ASTRO_TOOLBAR_SPOTLIGHT_BTN);
  expect(spotlightToolbarButtonVisible).toBe(true);

  const spotlightTriggerButtonVisible = await page.isVisible('div[title="Spotlight by Sentry"]');
  expect(spotlightTriggerButtonVisible).toBe(false);
});

test('clicking on spotlight button opens and closes spotlight', async ({ page }) => {
  await page.goto('http://localhost:4321');
  await waitForAstroToolbar(page);

  await page.click(ASTRO_TOOLBAR_SPOTLIGHT_BTN);

  await page.waitForTimeout(1000);
  expect(await page.getByText('Spotlight by Sentry').isVisible()).toBe(true);

  await page.click(ASTRO_TOOLBAR_SPOTLIGHT_BTN);
  await page.waitForTimeout(1000);

  expect(await page.getByText('Spotlight by Sentry').isVisible()).toBe(false);
});
