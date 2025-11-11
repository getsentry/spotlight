import { _electron as electron, expect, test } from "@playwright/test";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test("launch app", async () => {
  const app = await electron.launch({ args: ["./dist-electron/main/index.js", "--no-sandbox"] });

  const isPackaged = await app.evaluate(async ({ app }) => {
    // This runs in Electron's main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.isPackaged;
  });

  expect(isPackaged).toBe(false);

  // Wait for the first BrowserWindow to open
  // and return its Page object
  const window = await app.firstWindow();

  const sidebar = window.getByRole("navigation", { name: "Navigation" });

  await sidebar.getByText("Spotlight").waitFor({ state: "visible" });

  await sleep(2000);

  expect(sidebar.getByText("Traces").first()).toHaveText("Traces");
  expect(sidebar.getByText("Errors").first()).toHaveText("Errors");

  // close app
  await app.close();
});
