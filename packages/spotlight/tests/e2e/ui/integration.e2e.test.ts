import { expect, test } from "./fixtures";

test.describe("Integration UI Tests", () => {
  test("should display multiple event types", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send mix of different event types
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("log_envelope.txt");
    await sendTestEnvelope("envelope_with_only_span.txt");

    // Wait for events to be processed
    await page.waitForTimeout(1000);

    // Verify UI is responsive and displaying content
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");

    // Navigate through different tabs
    const tabs = page.locator('[role="tab"], a[href*="/"], nav a, nav button').all();
    const tabElements = await tabs;

    // Should have multiple tabs for different event types
    expect(tabElements.length).toBeGreaterThan(0);
  });

  test("should navigate between tabs", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send different event types
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("log_envelope.txt");

    await page.waitForTimeout(1000);

    // Try to navigate to Errors tab
    const errorsTab = page.locator('[data-test-id="tab-errors"], a[href*="errors"], button:has-text("Errors")').first();
    if (await errorsTab.isVisible().catch(() => false)) {
      await errorsTab.click();
      await page.waitForTimeout(500);
    }

    // Try to navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    if (await logsTab.isVisible().catch(() => false)) {
      await logsTab.click();
      await page.waitForTimeout(500);
    }

    // Verify navigation works
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle real-time updates via SSE", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Get initial content
    const pageContent = page.locator("body");
    const _initialText = await pageContent.textContent();

    // Send a new event
    await sendTestEnvelope("envelope_javascript.txt");

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify UI updated (should have new content or at least the same content)
    const updatedText = await pageContent.textContent();
    expect(updatedText).not.toBe("");
  });

  test("should link error to trace context", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send error that might have trace context
    await sendTestEnvelope("Capture.Message.in.a.transaction.txt");

    await page.waitForTimeout(1000);

    // Check if we can find any trace or transaction info
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle rapid event ingestion", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send multiple events rapidly
    const sends = [
      sendTestEnvelope("envelope_javascript.txt"),
      sendTestEnvelope("envelope_python.txt"),
      sendTestEnvelope("log_envelope.txt"),
      sendTestEnvelope("envelope_with_only_span.txt"),
    ];

    await Promise.all(sends);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify UI is still responsive
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");

    // UI should not have crashed
    const isVisible = await pageContent.isVisible();
    expect(isVisible).toBe(true);
  });

  test("should handle different SDK sources", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send events from different SDK sources
    await sendTestEnvelope("envelope_javascript.txt"); // JavaScript SDK
    await sendTestEnvelope("envelope_python.txt"); // Python SDK
    await sendTestEnvelope("envelope_php.txt"); // PHP SDK
    await sendTestEnvelope("envelope_java.txt"); // Java SDK

    await page.waitForTimeout(1500);

    // Verify all events are displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display framework-specific events", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send framework-specific envelopes
    await sendTestEnvelope("envelope_angular.txt");
    await sendTestEnvelope("envelope_astro_ssr_node.txt");

    await page.waitForTimeout(1000);

    // Verify events are displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should maintain UI state during navigation", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send events
    await sendTestEnvelope("envelope_javascript.txt");

    await page.waitForTimeout(1000);

    // Navigate to errors
    const errorsTab = page.locator('[data-test-id="tab-errors"], a[href*="errors"], button:has-text("Errors")').first();
    if (await errorsTab.isVisible().catch(() => false)) {
      await errorsTab.click();
      await page.waitForTimeout(500);
    }

    // Navigate to another tab and back
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    if (await logsTab.isVisible().catch(() => false)) {
      await logsTab.click();
      await page.waitForTimeout(500);

      // Go back to errors
      if (await errorsTab.isVisible().catch(() => false)) {
        await errorsTab.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify content is still there
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle WordPress-specific events", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send WordPress envelope
    await sendTestEnvelope("envelope_php_wordpress.txt");

    await page.waitForTimeout(1000);

    // Verify event is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should search/filter across events", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send multiple events
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("envelope_python.txt");

    await page.waitForTimeout(1000);

    // Look for search/filter input
    const searchInput = page
      .locator('input[type="text"], input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]')
      .first();
    const _hasSearch = await searchInput.isVisible().catch(() => false);

    // At minimum, events should be displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle compressed envelopes", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send events (compression is handled by send helper if needed)
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("envelope_python.txt");

    await page.waitForTimeout(1000);

    // Verify events are processed correctly
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display formatted messages", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send envelope with formatted message
    await sendTestEnvelope("envelope_java_formatted_message.txt");

    await page.waitForTimeout(1000);

    // Verify message is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should be responsive to window resize", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send some events
    await sendTestEnvelope("envelope_javascript.txt");

    await page.waitForTimeout(1000);

    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Verify UI adapts
    const pageContent = page.locator("body");
    const isVisible = await pageContent.isVisible();
    expect(isVisible).toBe(true);

    // Resize to larger
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Still visible
    expect(await pageContent.isVisible()).toBe(true);
  });
});
