import { expect, test } from '@playwright/test';

test('custom integration in spotlight should add perfectly', async ({ page }) => {
  // go to home page
  await page.goto('/');

  // Open up the spotlight overlay
  await page.click('id=spotlight-overlay-trigger');

  // Check for custom integration tab
  const customIntegrationLink = await page.$('a[href="/custom"]');
  expect(customIntegrationLink).not.toBeNull();

  // Click and go to tab
  await customIntegrationLink?.click();

  // Check for custom text
  await expect(page.getByText('Custom Tab Content')).toBeVisible();
});
