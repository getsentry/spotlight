import type { ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, test as base } from "@playwright/test";
import { findFreePort, getFixturePath, killProcess, spawnProcess } from "../shared/utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface SidecarFixture {
  port: number;
  process: ChildProcess;
  baseURL: string;
}

export interface TestFixtures {
  sidecar: SidecarFixture;
  sendTestEnvelope: (fixtureFile: string) => Promise<void>;
  waitForEvent: (page: Page, selector: string, timeout?: number) => Promise<void>;
}

/**
 * Start sidecar server for UI tests
 */
async function startSidecar(): Promise<SidecarFixture> {
  const port = await findFreePort();
  const binPath = path.join(__dirname, "../../../dist/run.js");

  const proc = spawnProcess("node", [binPath, "server", "-p", port.toString()]);

  // Wait for server to be ready
  const startTime = Date.now();
  const timeout = 10000;

  while (Date.now() - startTime < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, res => {
          res.resume();
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve();
          } else {
            reject(new Error(`Health check failed with status ${res.statusCode}`));
          }
        });
        req.on("error", reject);
        req.setTimeout(1000);
      });

      // Server is ready
      return {
        port,
        process: proc.process,
        baseURL: `http://localhost:${port}`,
      };
    } catch {
      // Retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Sidecar not ready after ${timeout}ms`);
}

/**
 * Stop sidecar server
 */
async function stopSidecar(sidecar: SidecarFixture): Promise<void> {
  if (sidecar.process.pid && !sidecar.process.killed) {
    await killProcess(sidecar.process);
  }
}

/**
 * Send an envelope file to the sidecar
 */
async function sendEnvelopeToSidecar(
  port: number,
  envelopeFilePath: string,
  compression: "none" | "gzip" = "none",
): Promise<void> {
  const data = await fs.readFile(envelopeFilePath);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-sentry-envelope",
  };

  let body = data;

  if (compression === "gzip") {
    const zlib = await import("node:zlib");
    const { promisify } = await import("node:util");
    body = await promisify(zlib.gzip)(data);
    headers["Content-Encoding"] = "gzip";
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path: "/stream",
        method: "POST",
        headers,
      },
      res => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
        res.resume();
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Wait for an event to appear in the UI
 */
async function waitForEventInUI(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { timeout, state: "visible" });
}

/**
 * Extended test with sidecar fixture
 */
export const test = base.extend<TestFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern requires empty object
  sidecar: async ({}, use) => {
    const sidecar = await startSidecar();
    await use(sidecar);
    await stopSidecar(sidecar);
  },

  sendTestEnvelope: async ({ sidecar }, use) => {
    const sender = async (fixtureFile: string) => {
      const fullPath = getFixturePath(fixtureFile);
      await sendEnvelopeToSidecar(sidecar.port, fullPath);
      // Give the UI a moment to process the event
      await new Promise(resolve => setTimeout(resolve, 500));
    };
    await use(sender);
  },

  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern requires empty object
  waitForEvent: async ({}, use) => {
    await use(waitForEventInUI);
  },
});

export { expect } from "@playwright/test";
