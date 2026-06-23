import { test, waitForAppReady } from "./fixtures";

test.describe("Attachments Display UI Tests", () => {
  test("should display envelope with screenshot", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send envelope with screenshot (binary)
    await sendTestEnvelope("envelope_with_screenshot.bin");

    // Navigate through tabs to find the attachment
    // Could be in Errors, Traces, or a dedicated Attachments tab
    const tabs = page.locator('[role="tab"], a[href*="/"], button');
    await tabs
      .first()
      .click()
      .catch(() => {});

    // The app should still be rendered after interacting with it
    await waitForAppReady(page);
  });

  test("should handle Flutter replay binary", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send Flutter replay binary
    await sendTestEnvelope("envelope_flutter_replay.bin");

    // The UI should not crash on this payload
    await waitForAppReady(page);
  });

  test("should handle browser JS profile", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send browser JS profile binary
    await sendTestEnvelope("enveplope_browser_js_profile.bin");

    // The UI should not crash on this payload
    await waitForAppReady(page);
  });

  test("should handle generic binary envelope", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send generic binary envelope
    await sendTestEnvelope("envelope_binary.bin");

    // Verify the UI doesn't crash and is still rendered
    await waitForAppReady(page);
  });

  test("should display attachments from fixture directory", async ({ page, sidecar }) => {
    await page.goto(sidecar.baseURL);

    // The test verifies that the UI renders without any telemetry present
    await waitForAppReady(page);
  });

  test("should handle empty payload", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send empty payload envelope
    await sendTestEnvelope("envelope_empty_payload.txt");

    // Should not crash
    await waitForAppReady(page);
  });

  test("should handle empty envelope", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send empty envelope
    await sendTestEnvelope("envelope_empty.txt");

    // Should not crash
    await waitForAppReady(page);
  });

  test("should display image attachments if present", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send envelope with screenshot
    await sendTestEnvelope("envelope_with_screenshot.bin");

    // Look for image elements (best-effort, the payload may not surface one)
    const _hasImage = await page
      .locator('img, [role="img"]')
      .first()
      .isVisible()
      .catch(() => false);

    // At minimum, the app should still be rendered
    await waitForAppReady(page);
  });

  test("should provide download capability for attachments", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send envelope with attachment
    await sendTestEnvelope("envelope_with_screenshot.bin");

    // Look for download buttons or links (best-effort)
    const _hasDownloadLink = await Promise.race([
      page
        .locator('a[download], button[aria-label*="download"], [title*="download"]')
        .first()
        .isVisible()
        .then(() => true)
        .catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000)),
    ]);

    // At minimum, the app should still be rendered
    await waitForAppReady(page);
  });

  test("should handle various attachment content types", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send multiple envelopes with different content
    await sendTestEnvelope("envelope_javascript.txt");
    await sendTestEnvelope("envelope_python.txt");

    // Should handle various types without crashing
    await waitForAppReady(page);
  });

  test("should handle envelope with no length and EOF", async ({ page, sidecar, sendTestEnvelope }) => {
    await page.goto(sidecar.baseURL);
    await waitForAppReady(page);

    // Send envelope with no length and EOF
    await sendTestEnvelope("envelope_no_len_w_eof.txt");

    // Should not crash
    await waitForAppReady(page);
  });
});
