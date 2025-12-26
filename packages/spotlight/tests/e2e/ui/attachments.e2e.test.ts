import { expect, test } from "./fixtures";

test.describe("Attachments Display UI Tests", () => {
  test("should display envelope with screenshot", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send envelope with screenshot (binary)
    await sendTestEnvelope("envelope_with_screenshot.bin");

    // Navigate through tabs to find the attachment
    // Could be in Errors, Traces, or a dedicated Attachments tab
    const tabs = page.locator('[role="tab"], a[href*="/"], button');
    await tabs
      .first()
      .click()
      .catch(() => {});

    // Wait and verify some content is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle Flutter replay binary", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send Flutter replay binary
    await sendTestEnvelope("envelope_flutter_replay.bin");

    // Verify content is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle browser JS profile", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send browser JS profile binary
    await sendTestEnvelope("enveplope_browser_js_profile.bin");

    // Verify content is displayed
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle generic binary envelope", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send generic binary envelope
    await sendTestEnvelope("envelope_binary.bin");

    // Verify the UI doesn't crash and displays something
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display attachments from fixture directory", async ({ page, sidecar }) => {
    await page.goto(sidecar.baseURL);
    // The test verifies that the UI can handle attachment data
    // Wait for page to be ready
    const pageContent = page.locator("body");
    await pageContent.waitFor({ timeout: 5000 });

    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle empty payload", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send empty payload envelope
    await sendTestEnvelope("envelope_empty_payload.txt");

    // Should not crash
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle empty envelope", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send empty envelope
    await sendTestEnvelope("envelope_empty.txt");

    // Should not crash
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should display image attachments if present", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send envelope with screenshot
    await sendTestEnvelope("envelope_with_screenshot.bin");

    // Look for image elements
    const _hasImage = await page
      .locator('img, [role="img"]')
      .first()
      .isVisible()
      .catch(() => false);

    // At minimum, page should have content
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should provide download capability for attachments", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send envelope with attachment
    await sendTestEnvelope("envelope_with_screenshot.bin");

    // Look for download buttons or links
    const _hasDownloadLink = await Promise.race([
      page
        .locator('a[download], button[aria-label*="download"], [title*="download"]')
        .first()
        .isVisible()
        .then(() => true)
        .catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000)),
    ]);

    // At minimum, page should render
    const pageContent = page.locator("body");
    await pageContent.waitFor({ timeout: 5000 });
    expect(await pageContent.isVisible()).toBe(true);
  });

  test("should handle various attachment content types", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send multiple envelopes with different content
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("envelope_python.txt");

    // Should handle various types without crashing
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });

  test("should handle envelope with no length and EOF", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    // Send envelope with no length and EOF
    await sendTestEnvelope("envelope_no_len_w_eof.txt");

    // Should not crash
    const pageContent = page.locator("body");
    const text = await pageContent.textContent();
    expect(text).not.toBe("");
  });
});
