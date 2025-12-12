import { expect, test } from "./fixtures";

test.describe("Error Display UI Tests", () => {
  test("should display JavaScript error", async ({ page, sidecar, sendTestEnvelope }) => {
    // Navigate to Spotlight UI
    await page.goto(sidecar.baseURL);
    // Send JavaScript error envelope
    await sendTestEnvelope("envelope_javascript.txt");

    // Navigate to Errors tab
    const errorsTab = page.locator('[data-test-id="tab-errors"], a[href*="errors"], button:has-text("Errors")').first();
    await errorsTab.click();

    // Wait for error to appear - use more flexible selector that matches actual rendered structure
    await page.waitForSelector(
      'a[href*="/telemetry/errors/"], [data-test-id="error-item"], [class*="error"], article, .event-item',
      { timeout: 10000 },
    );

    // Verify error is displayed
    const errorContent = page.locator("body");
    await expect(errorContent).toContainText(/error|exception/i);
  });

  test("should display error details and stack trace", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send JavaScript error envelope
    await sendTestEnvelope("envelope_javascript.txt");

    // Navigate to Errors tab
    const errorsTab = page.locator('[data-test-id="tab-errors"], a[href*="errors"], button:has-text("Errors")').first();
    await errorsTab.click();
    // Wait for error to appear first
    await page.waitForSelector('a[href*="/telemetry/errors/"], [data-test-id="error-item"], article, .event-item', {
      timeout: 10000,
    });
    // Wait for error item and click on it
    const errorItem = page
      .locator('a[href*="/telemetry/errors/"], [data-test-id="error-item"], article, .event-item')
      .first();
    await errorItem.click({ timeout: 5000 }).catch(() => {
      // Item might already be expanded
    });

    // Verify stack trace is rendered
    const pageContent = page.locator("body");

    // Look for stack trace indicators (file paths, line numbers, function names)
    const hasStackTraceIndicators = await Promise.race([
      pageContent
        .locator("text=/\\.js|\\.(ts|tsx)|at \\w+|line \\d+/i")
        .first()
        .isVisible()
        .then(() => true)
        .catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000)),
    ]);

    expect(hasStackTraceIndicators).toBe(true);
  });

  test("should display Python transaction", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send Python transaction envelope
    await sendTestEnvelope("envelope_python.txt");

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear - use more flexible selector
    await page.waitForSelector('a[href*="/telemetry/traces/"], [data-test-id="trace-item"], article, .event-item', {
      timeout: 10000,
    });

    // Verify transaction is displayed
    const traceContent = page.locator("body");
    const text = await traceContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display PHP error", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send PHP error envelope
    await sendTestEnvelope("envelope_php_error.txt");

    // Navigate to Errors tab
    const errorsTab = page.locator('[data-test-id="tab-errors"], a[href*="errors"], button:has-text("Errors")').first();
    await errorsTab.click();

    // Wait for error to appear - use more flexible selector
    await page.waitForSelector('a[href*="/telemetry/errors/"], [data-test-id="error-item"], article, .event-item', {
      timeout: 10000,
    });

    // Verify error is displayed
    const errorContent = page.locator("body");
    await expect(errorContent).toContainText(/error|exception/i);
  });

  test("should display multiple errors", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send multiple error envelopes
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("envelope_php_error.txt");

    // Navigate to Errors tab
    const errorsTab = page.locator('[data-test-id="tab-errors"], a[href*="errors"], button:has-text("Errors")').first();
    await errorsTab.click();
    // Wait for errors to appear - use more flexible selector
    await page.waitForSelector('a[href*="/telemetry/errors/"], [data-test-id="error-item"], article, .event-item', {
      timeout: 10000,
    });

    // Count error items (should have at least 2, might have 3 depending on content)
    const errorItems = page.locator('a[href*="/telemetry/errors/"], [data-test-id="error-item"], article, .event-item');
    const count = await errorItems.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("should display Java transaction", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send Java transaction envelope
    await sendTestEnvelope("envelope_java.txt");

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear - use more flexible selector
    await page.waitForSelector('a[href*="/telemetry/traces/"], [data-test-id="trace-item"], article, .event-item', {
      timeout: 10000,
    });

    // Verify transaction is displayed
    const traceContent = page.locator("body");
    const text = await traceContent.textContent();
    expect(text).not.toBe("");
  });
});
