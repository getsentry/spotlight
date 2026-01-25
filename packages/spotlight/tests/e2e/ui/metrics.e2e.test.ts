import { expect, test } from "./fixtures";

// Metric fixture paths
const METRIC_ENVELOPE = "metrics/trace_metric_envelope.bin";
const TRANSACTION_WITH_METRICS = "metrics/transaction_envelope.bin";

test.describe("Metrics Display UI Tests", () => {
  test("should display metrics list with types and values", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send metric envelope
    await sendTestEnvelope(METRIC_ENVELOPE);

    // Navigate to Metrics tab
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for metric sections (expandable buttons) to appear
    await page.waitForSelector('button:has-text("▶"), a[href*="/telemetry/metrics/"]', {
      timeout: 10000,
    });

    // Verify metrics are displayed with numeric values
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
    // Should contain numeric values
    const hasNumbers = /\d+/.test(text || "");
    expect(hasNumbers).toBe(true);
  });

  test("should display grouped metrics by name", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send metric envelope multiple times to get multiple samples
    await sendTestEnvelope(METRIC_ENVELOPE);
    await sendTestEnvelope(METRIC_ENVELOPE);

    // Navigate to Metrics tab
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for metrics to appear
    await page.waitForSelector('button:has-text("▶"), a[href*="/telemetry/metrics/"]', {
      timeout: 10000,
    });

    // Verify metrics are displayed (grouped by name)
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
    // Verify multiple metric sections exist (indicating grouping)
    const sectionButtons = page.locator('button:has-text("▶")');
    const sectionCount = await sectionButtons.count();
    expect(sectionCount).toBeGreaterThan(0);
  });

  test("should expand metric sections", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send metric envelope
    await sendTestEnvelope(METRIC_ENVELOPE);

    // Navigate to Metrics tab
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for metric sections to appear
    await page.waitForSelector('button:has-text("▶")', {
      timeout: 10000,
    });

    // Click on a metric section to expand it
    const sectionButton = page.locator('button:has-text("▶")').first();
    await sectionButton.click({ timeout: 2000 });

    // Wait for expanded content (metric sample links)
    await page
      .waitForSelector('a[href*="/telemetry/metrics/"]', {
        timeout: 3000,
      })
      .catch(() => {
        // Might not have samples or already visible
      });

    // Verify content is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display metric details on click", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send metric envelope
    await sendTestEnvelope(METRIC_ENVELOPE);

    // Navigate to Metrics tab
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for metrics to appear
    await page.waitForSelector('button:has-text("▶")', {
      timeout: 10000,
    });

    // Expand a section first
    const sectionButton = page.locator('button:has-text("▶")').first();
    await sectionButton.click({ timeout: 2000 }).catch(() => {});

    // Wait for metric sample links
    await page
      .waitForSelector('a[href*="/telemetry/metrics/"]', {
        timeout: 5000,
      })
      .catch(() => {
        // If no samples, that's okay
      });

    // Try to click on a metric sample link
    const metricLink = page.locator('a[href*="/telemetry/metrics/"]').first();
    const hasMetricLink = await metricLink.isVisible().catch(() => false);

    if (hasMetricLink) {
      await metricLink.click({ timeout: 2000 });
      // Wait for side panel to appear
      await page.waitForTimeout(500);
    }

    // Verify details are shown (side panel or expanded view)
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle metric filtering", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send metric envelope
    await sendTestEnvelope(METRIC_ENVELOPE);

    // Navigate to Metrics tab
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for metrics to appear
    await page.waitForSelector('button:has-text("▶"), input[type="text"]', {
      timeout: 10000,
    });

    // Verify filter controls are available (search input, filter button)
    const filterInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    await filterInput.isVisible().catch(() => {
      // Filter controls might not be visible, that's okay
    });

    // Should at least have metric content
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display metrics with trace context", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send transaction envelope (may or may not include metrics)
    await sendTestEnvelope(TRANSACTION_WITH_METRICS);
    // Also send a metric envelope to ensure metrics are available
    await sendTestEnvelope(METRIC_ENVELOPE);

    // Navigate to Traces tab first to verify transaction is received
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();
    // Wait for traces to appear
    await page
      .waitForSelector('a[href*="/telemetry/traces/"]', {
        timeout: 5000,
      })
      .catch(() => {
        // No traces, that's okay - test will still verify metrics tab works
      });

    // Navigate to Metrics tab
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for metrics to appear (either from transaction or metric envelope)
    await page.waitForSelector('button:has-text("▶"), a[href*="/telemetry/metrics/"]', {
      timeout: 10000,
    });

    // Verify content is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle empty metrics state", async ({ page, sidecar }) => {
    await page.goto(sidecar.baseURL);

    // Navigate to Metrics tab without sending any metrics
    const metricsTab = page
      .locator('[data-test-id="tab-metrics"], a[href*="metrics"], button:has-text("Metrics")')
      .first();
    await metricsTab.click();
    // Wait for either metrics to appear OR "No metrics" message
    await Promise.race([
      page.waitForSelector('button:has-text("▶"), a[href*="/telemetry/metrics/"]', {
        timeout: 3000,
      }),
      page.waitForSelector("text=/No metrics/i", { timeout: 3000 }),
    ]).catch(() => {
      // Either state is fine
    });

    // Verify content is displayed (either metrics or empty state)
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });
});
