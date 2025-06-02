import { expect, test } from "@playwright/test";
import { waitForAstroToolbar } from "./utils/test-utils";

const ASTRO_TOOLBAR_SPOTLIGHT_BTN = 'button[data-app-id="spotlight-plugin"]';

test("has Astro Dev Toolbar", async ({ page }) => {
  await page.goto("http://localhost:4321");

  await expect(page).toHaveTitle(/Astro/);

  await waitForAstroToolbar(page);

  const toolbarVisible = await page.isVisible("#dev-bar");
  expect(toolbarVisible).toBe(true);
});

test("Astro dev toolbar has spotlight button", async ({ page }) => {
  await page.goto("http://localhost:4321");
  await waitForAstroToolbar(page);

  const spotlightToolbarButtonVisible = await page.isVisible(ASTRO_TOOLBAR_SPOTLIGHT_BTN);
  expect(spotlightToolbarButtonVisible).toBe(true);

  const spotlightTriggerButtonVisible = await page.isVisible('div[title="Spotlight by Sentry"]');
  expect(spotlightTriggerButtonVisible).toBe(false);
});

test("clicking on spotlight button opens and closes Spotlight", async ({ page }) => {
  await page.goto("http://localhost:4321");
  await waitForAstroToolbar(page);

  // Closed at the beginning
  await expect(page.getByText("Connected to Sidecar")).toBeHidden();

  // Open after first click
  await page.click(ASTRO_TOOLBAR_SPOTLIGHT_BTN);
  await expect(page.getByText("Connected to Sidecar")).toBeVisible();

  // Close after another click
  await page.click(ASTRO_TOOLBAR_SPOTLIGHT_BTN);
  await expect(page.getByText("Connected to Sidecar")).toBeHidden();
});

test("pressing CTRL+F12 opens and closes Spotlight", async ({ page }) => {
  await page.goto("http://localhost:4321");
  await waitForAstroToolbar(page);

  // Closed at the beginning
  await expect(page.getByText("Connected to Sidecar")).toBeHidden();

  // Open after first keypress
  await page.keyboard.press("Control+F12");
  await expect(page.getByText("Connected to Sidecar")).toBeVisible();

  // Close after first keypress
  await page.keyboard.press("Control+F12");
  await expect(page.getByText("Connected to Sidecar")).toBeHidden();
});
