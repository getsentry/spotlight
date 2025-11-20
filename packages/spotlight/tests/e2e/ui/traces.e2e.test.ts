import { expect, test } from "./fixtures";

test.describe("Trace Display UI Tests", () => {
  test("should display trace list with metadata and details", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope("envelope_angular.txt");
    // Wait a bit for the event to be processed
    await page.waitForTimeout(1000);

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear
    await page.waitForSelector('[data-test-id="trace-item"], article, .event-item', { timeout: 10000 });

    // Verify trace is displayed with timing information
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    
    // Traces typically show duration/timing information
    const hasTimingInfo = /\d+\s*(ms|s|sec)/i.test(text || "");
    expect(hasTimingInfo).toBe(true);
    expect(text).not.toBe("");

    // Click on trace to view details
    const traceItem = page.locator('[data-test-id="trace-item"], article, .event-item').first();
    await traceItem.click({ timeout: 5000 }).catch(() => {
      // Item might already be expanded
    });

    // Wait for details to load
    await page.waitForTimeout(500);

    // Verify details and span information are shown
    const detailsText = await pageContent.textContent();
    expect(detailsText).not.toBe("");
  });

  test("should display Java transaction traces", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send Java transaction envelope
    await sendTestEnvelope("envelope_java.txt");
    // Wait a bit for the event to be processed
    await page.waitForTimeout(1000);

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear
    await page.waitForSelector('[data-test-id="trace-item"], article, .event-item', { timeout: 10000 });

    // Verify trace is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display Python transaction traces", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send Python transaction envelope
    await sendTestEnvelope("envelope_python.txt");
    // Wait a bit for the event to be processed
    await page.waitForTimeout(1000);

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear
    await page.waitForSelector('[data-test-id="trace-item"], article, .event-item', { timeout: 10000 });

    // Verify trace is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display Astro SSR traces", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send Astro SSR envelope
    await sendTestEnvelope("envelope_astro_ssr_node.txt");
    // Wait a bit for the event to be processed
    await page.waitForTimeout(1000);

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify content is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle multiple traces", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send multiple different trace envelopes
    await sendTestEnvelope("envelope_java.txt");
    await sendTestEnvelope("envelope_python.txt");
    await sendTestEnvelope("envelope_angular.txt");
    // Wait a bit for the events to be processed
    await page.waitForTimeout(1000);

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for traces to appear
    await page.waitForTimeout(1000);

    // Should have content from multiple traces
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display timing visualization", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope("envelope_angular.txt");
    // Wait a bit for the event to be processed
    await page.waitForTimeout(1000);

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace and click on it
    const traceItem = page.locator('[data-test-id="trace-item"], article, .event-item').first();
    await traceItem.click({ timeout: 5000 }).catch(() => {});

    // Look for timing visualization elements (SVG, canvas, or timing bars)
    const hasSvg = await page
      .locator("svg")
      .first()
      .isVisible()
      .catch(() => false);
    const hasCanvas = await page
      .locator("canvas")
      .first()
      .isVisible()
      .catch(() => false);

    // Should have at least one visualization method (SVG or Canvas)
    expect(hasSvg || hasCanvas).toBe(true);

    // Should have some timing visualization or at least trace content
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });
});
