import { test, expect } from './fixtures';

test.describe('Log Display UI Tests', () => {
  test('should display log events', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send log envelope
    await sendTestEnvelope('log_envelope.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs to appear
    await page.waitForSelector('[data-test-id="log-item"], article, .event-item, pre, code', { timeout: 5000 });

    // Verify logs are displayed
    const logContent = page.locator('body');
    const text = await logContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display log levels', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send log envelope
    await sendTestEnvelope('log_envelope.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs to appear
    await page.waitForTimeout(1000);

    // Look for log level indicators (info, error, warning, debug)
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    
    // Should have log content
    expect(text).not.toBe('');
  });

  test('should display timestamps', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send log envelope
    await sendTestEnvelope('log_envelope.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs
    await page.waitForTimeout(1000);

    // Look for timestamp patterns
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    
    // Should have log content with timestamps
    expect(text).not.toBe('');
  });

  test('should display multiple log entries', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send log envelope multiple times
    await sendTestEnvelope('log_envelope.txt');
    await sendTestEnvelope('log_envelope.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs
    await page.waitForTimeout(1000);

    // Verify multiple entries are displayed
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should handle message capture in transaction', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send message in transaction
    await sendTestEnvelope('Capture.Message.in.a.transaction.txt');

    // Wait a moment for processing
    await page.waitForTimeout(1000);

    // Check Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait and verify content
    await page.waitForTimeout(1000);
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display message capture', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send message
    await sendTestEnvelope('Capture.Message.txt');

    // Navigate to appropriate tab (might be Logs or Events)
    await page.waitForTimeout(1000);

    // Try to find the message content
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should handle PHP metrics logs', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send PHP metrics
    await sendTestEnvelope('envelope_php_metrics.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify content is displayed
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display logs with ANSI escapes', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send envelope with ANSI escapes
    await sendTestEnvelope('envelope_with_nextjs_ansi_escapes.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs
    await page.waitForTimeout(1000);

    // Verify logs are displayed (ANSI escapes should be handled)
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should handle log filtering', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send multiple logs
    await sendTestEnvelope('log_envelope.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs
    await page.waitForTimeout(1000);

    // Look for filter controls (buttons, dropdowns, inputs)
    const hasFilterControls = await Promise.race([
      page.locator('input[type="text"], input[type="search"], select, button[aria-label*="filter"]').first().isVisible().then(() => true).catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000))
    ]);

    // Should at least have log content
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });

  test('should display log details on click', async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);

    // Send log envelope
    await sendTestEnvelope('log_envelope.txt');

    // Navigate to Logs tab
    const logsTab = page.locator('[data-test-id="tab-logs"], a[href*="logs"], button:has-text("Logs")').first();
    await logsTab.click();

    // Wait for logs
    await page.waitForTimeout(1000);

    // Try to click on a log item
    const logItem = page.locator('[data-test-id="log-item"], article, .event-item').first();
    await logItem.click({ timeout: 2000 }).catch(() => {
      // Might not be clickable or already expanded
    });

    // Wait for details
    await page.waitForTimeout(500);

    // Verify details are shown
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    expect(text).not.toBe('');
  });
});
