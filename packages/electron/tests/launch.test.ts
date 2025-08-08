import { _electron as electron, expect, test } from "@playwright/test";

test("launch app", async () => {
  const app = await electron.launch({ args: ["./out/main/index.js", "--no-sandbox"] });

  const isPackaged = await app.evaluate(async ({ app }) => {
    // This runs in Electron's main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.isPackaged;
  });

  expect(isPackaged).toBe(false);

  // Wait for the first BrowserWindow to open
  // and return its Page object
  const window = await app.firstWindow();
  await window.getByRole("navigation", { name: "Navigation" }).getByText("Spotlight").waitFor({ state: "visible" });

  // close app
  await app.close();
});
