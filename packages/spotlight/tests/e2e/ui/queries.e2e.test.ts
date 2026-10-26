import { expect, test, waitForAppReady } from "./fixtures";

test("streamed v2 database spans populate Queries and link to span details", async ({
  page,
  sidecar,
  sendTestEnvelope,
}) => {
  // Captured from @sentry/node 11.9.0 with the default streaming lifecycle.
  const query = 'SELECT "public"."Customer"."id" FROM "public"."Customer"';
  const traceId = "a9eab6940aba4ae7bf2f8ac5a54c6a2f";
  const spanId = "832028f3635102b6";
  await page.goto(`${sidecar.baseURL}/telemetry/insights/queries`);
  await waitForAppReady(page);
  await expect(page.getByText("No queries captured.", { exact: false })).toBeVisible();

  await sendTestEnvelope("envelope_span_v2.txt");

  const row = page.locator("tbody tr").filter({ hasText: query });
  await expect(row).toBeVisible();
  await expect(row.getByRole("cell").nth(1)).toHaveText("125ms");
  await expect(row.getByRole("cell").nth(2)).toHaveText("125ms");
  await row.click();

  const spanLink = page.locator(`a[href="/telemetry/traces/${traceId}/spans/${spanId}"]`);
  await expect(spanLink).toBeVisible();
  await spanLink.click();
  await expect(page.getByRole("heading", { name: "ID", exact: true }).locator("..")).toContainText(spanId);
  await expect(page.getByText('"postgresql"', { exact: true })).toBeVisible();
  await expect(page.getByText("No queries captured.", { exact: false })).not.toBeVisible();
});
