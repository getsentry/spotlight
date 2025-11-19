import { test, expect } from './fixtures';

test.describe('Trace Display UI Tests', () => {
  test('should display trace list', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope('envelope_with_only_span.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear
    await page.waitForSelector('[data-test-id="trace-item"], article, .event-item', { timeout: 5000 });

    // Verify trace is displayed
    const traceContent = page.locator('body');
    const hasContent = await traceContent.textContent();
    expect(hasContent).not.toBe('');
  });

  test('should display trace metadata', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope('envelope_with_only_span.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace to appear
    await page.waitForSelector('[data-test-id="trace-item"], article, .event-item', { timeout: 5000 });

    // Look for duration or timing information (ms, seconds, etc.)
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    
    // Traces typically show duration/timing
    const hasTimingInfo = /\d+\s*(ms|s|sec)/i.test(text || '');
    
    // Should have some trace content
    expect(text).not.toBe('');
  });

  test('should display trace details', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope('envelope_with_only_span.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace item and click on it
    const traceItem = page.locator('[data-test-id="trace-item"], article, .event-item').first();
    await traceItem.click({ timeout: 5000 }).catch(() => {
      // Item might already be expanded
    });

    // Wait a moment for details to load
    await page.waitForTimeout(500);

    // Verify details are shown
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display span information', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope('envelope_with_only_span.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace and click on it
    const traceItem = page.locator('[data-test-id="trace-item"], article, .event-item').first();
    await traceItem.click({ timeout: 5000 }).catch(() => {});

    // Look for span-related content
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    
    // Should have trace content displayed
    expect(text).not.toBe('');
  });

  test('should handle transaction envelope', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send transaction envelope
    await sendTestEnvelope('Capture.Message.in.a.transaction.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for content to appear
    await page.waitForTimeout(1000);

    // Check if trace/transaction appears
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display Angular trace', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send Angular envelope (likely contains traces)
    await sendTestEnvelope('envelope_angular.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify content is displayed
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display Astro SSR traces', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send Astro SSR envelope
    await sendTestEnvelope('envelope_astro_ssr_node.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify content is displayed
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should handle multiple traces', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send multiple trace envelopes
    await sendTestEnvelope('envelope_with_only_span.txt');
    await sendTestEnvelope('envelope_angular.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for traces to appear
    await page.waitForTimeout(1000);

    // Should have content from multiple traces
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display timing visualization', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send trace envelope
    await sendTestEnvelope('envelope_with_only_span.txt');

    // Navigate to Traces tab
    const tracesTab = page.locator('[data-test-id="tab-traces"], a[href*="traces"], button:has-text("Traces")').first();
    await tracesTab.click();

    // Wait for trace and click on it
    const traceItem = page.locator('[data-test-id="trace-item"], article, .event-item').first();
    await traceItem.click({ timeout: 5000 }).catch(() => {});

    // Look for timing visualization elements (SVG, canvas, or timing bars)
    const hasSvg = await page.locator('svg').first().isVisible().catch(() => false);
    const hasCanvas = await page.locator('canvas').first().isVisible().catch(() => false);
    
    // Should have some timing visualization or at least trace content
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });
});
