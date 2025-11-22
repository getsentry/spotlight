import { defineConfig, devices } from "@playwright/test";

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Timeout per test
  timeout: 30 * 1000,
  // Test directory
  testDir: "tests",
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: "test-results/",

  // Run tests in files in parallel
  fullyParallel: !process.env.CI,

  use: {
    // Base URL for UI tests
    baseURL: process.env.SPOTLIGHT_BASE_URL || "http://localhost:8969",
    // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: "retry-with-trace",
    // Screenshot on failure
    screenshot: "only-on-failure",
    // Video on failure
    video: "retain-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
      },
    },
  ],
});
