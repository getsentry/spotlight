import { expect, test } from '@playwright/test';

test('browser events are sent to spotlight', async ({ page }) => {
	// go to home page
	await page.goto('/error');

	await page.waitForFunction(() => {
		const hydratedFlag = document.getElementById('hydrated');
		return hydratedFlag && hydratedFlag.textContent === 'true';
	});

	// trigger error
	await page.locator('#errBtn').click();

	// Open up the spotlight overlay
	await page.click('id=spotlight-overlay-trigger');

	// Open errors tab
	await expect(page.locator('a[href="/errors"]')).toBeVisible();
	await page.locator('a[href="/errors"]').click();

	// Check for error message being visible
	await expect(page.getByText('Oh no!')).toBeVisible();
});
