import { expect, test } from '@playwright/test';
import { waitForAstroToolbar } from './utils/test-utils';

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

  const spotlightToolbarButtonVisible = await page.isVisible('button[data-plugin-id="spotlight-plugin"]');
  expect(spotlightToolbarButtonVisible).toBe(true);

  const spotlightTriggerButtonVisible = await page.isVisible('div[title="Spotlight by Sentry"]');
  expect(spotlightTriggerButtonVisible).toBe(false);
});

test('clicking on spotlight button opens spotlight', async ({ page }) => {
  await page.goto('http://localhost:4321');
  await waitForAstroToolbar(page);

  await page.getByRole('button', {});

  const spotlightTriggerButtonVisible = await page.isVisible('div[title="Spotlight by Sentry"]');
  expect(spotlightTriggerButtonVisible).toBe(true);
});
