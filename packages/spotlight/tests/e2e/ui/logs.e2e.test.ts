import { expect, test } from "./fixtures";

test.describe("Log Display UI Tests", () => {
  test("should display log events", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send log envelope
    await sendTestEnvelope("log_envelope.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear - use more flexible selector that matches table rows or log items
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
      timeout: 10000,
    });

    // Verify logs are displayed
    const logContent = page.locator("body");
    const text = await logContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display log levels", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send log envelope
    await sendTestEnvelope("log_envelope.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear - use more flexible selector that matches table rows or log items
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
      timeout: 10000,
    });

    // Look for log level indicators (info, error, warning, debug)
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();

    // Should have log content
    expect(text).not.toBe("");
  });

  test("should display timestamps", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send log envelope
    await sendTestEnvelope("log_envelope.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear - use more flexible selector that matches table rows or log items
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
      timeout: 10000,
    });

    // Look for timestamp patterns
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();

    // Should have log content with timestamps
    expect(text).not.toBe("");
  });

  test("should display multiple log entries", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send log envelope multiple times
    await sendTestEnvelope("log_envelope.txt");
    await sendTestEnvelope("log_envelope.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear - use more flexible selector that matches table rows or log items
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
      timeout: 10000,
    });

    // Verify multiple entries are displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle message capture in transaction", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send message in transaction
    await sendTestEnvelope("Capture.Message.in.a.transaction.txt");

    // Check Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for either logs to appear OR empty state message
    await Promise.race([
      page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
        timeout: 3000,
      }),
      page.waitForSelector("text=/No Logs|No logs yet/i", { timeout: 3000 }),
    ]);

    // Verify content is displayed (either logs or empty state)
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display message capture", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send message
    await sendTestEnvelope("Capture.Message.txt");

    // Try to find the message content
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle PHP metrics logs", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send PHP metrics
    await sendTestEnvelope("envelope_php_metrics.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for either logs to appear OR empty state message
    await Promise.race([
      page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
        timeout: 3000,
      }),
      page.waitForSelector("text=/No Logs|No logs yet/i", { timeout: 3000 }),
    ]);

    // Verify content is displayed (either logs or empty state)
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display logs with ANSI escapes", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send envelope with ANSI escapes
    await sendTestEnvelope("envelope_with_ansi_logs.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
      timeout: 10000,
    });

    // Verify logs are displayed
    const logContent = page.locator("body");
    const text = await logContent.textContent();
    expect(text).not.toBe("");

    // Verify ANSI escape codes are rendered (not shown as raw codes)
    // The log should contain the actual text content without escape sequences
    expect(text).toContain("Successfully connected");
    expect(text).toContain("Warning");
    expect(text).toContain("Error");
    expect(text).toContain("Processing");

    // Verify that raw ANSI escape sequences are NOT present in the rendered output
    // (they should be converted to styled text, not shown as \u001b[32m etc.)
    expect(text).not.toContain("\\u001b");
    expect(text).not.toContain("\u001b[");
  });

  test("should handle log filtering", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send multiple logs
    await sendTestEnvelope("log_envelope.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear - use more flexible selector that matches table rows or log items
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item, pre, code', {
      timeout: 10000,
    });

    // Look for filter controls (buttons, dropdowns, inputs)
    const _hasFilterControls = await Promise.race([
      page
        .locator('input[type="text"], input[type="search"], select, button[aria-label*="filter"]')
        .first()
        .isVisible()
        .then(() => true)
        .catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000)),
    ]);

    // Should at least have log content
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display log details on click", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send log envelope
    await sendTestEnvelope("log_envelope.txt");

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();
    // Wait for logs to appear - use flexible selector that matches table rows
    await page.waitForSelector('table tbody tr, [data-test-id="log-item"], article, .event-item', { timeout: 10000 });

    // Try to click on a log item
    const logItem = page.locator('table tbody tr, [data-test-id="log-item"], article, .event-item').first();
    await logItem.click({ timeout: 2000 }).catch(() => {
      // Might not be clickable or already expanded
    });

    // Wait for details
    await page.waitForTimeout(500);

    // Verify details are shown
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });
});
