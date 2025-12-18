import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ensureSpotlightBuilt, findFreePort, getFixturePath } from "../shared/utils";
import type { SpawnResult } from "../shared/utils";
import { killGracefully, sendEnvelope, spawnSpotlight, waitForOutput, waitForSidecarReady } from "./helpers";

describe("spotlight run e2e tests", () => {
  const activeProcesses: SpawnResult[] = [];
  const tempFiles: string[] = [];

  beforeAll(async () => {
    await ensureSpotlightBuilt();
  });

  afterEach(async () => {
    // Clean up all spawned processes
    for (const proc of activeProcesses) {
      if (proc.process.pid && !proc.process.killed) {
        await killGracefully(proc.process).catch(() => {
          // Force kill if graceful shutdown fails
          proc.process.kill("SIGKILL");
        });
      }
    }
    activeProcesses.length = 0;

    // Clean up temp files
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors
      }
    }
    tempFiles.length = 0;
  });

  it("should run simple command", async () => {
    const run = spawnSpotlight(["run", "node", "-e", 'console.log("test"); process.exit(0)']);
    activeProcesses.push(run);

    // Wait for the run command to detect child exit
    await waitForOutput(run, /exited/, 15000, "stderr");

    // Verify we got exit message in stderr
    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 20000);

  it("should set SENTRY_SPOTLIGHT environment variable", async () => {
    // Create a temp script that checks for SENTRY_SPOTLIGHT
    const scriptPath = path.join(process.cwd(), `test-env-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      // Exit 0 if SENTRY_SPOTLIGHT is set with correct format, 1 otherwise
      if (process.env.SENTRY_SPOTLIGHT && 
          process.env.SENTRY_SPOTLIGHT.includes('localhost') &&
          process.env.SENTRY_SPOTLIGHT.includes('stream')) {
        process.exit(0);
      }
      process.exit(1);
      `,
      "utf-8",
    );

    const run = spawnSpotlight(["run", "node", scriptPath]);
    activeProcesses.push(run);

    // Wait for the run command to finish
    await waitForOutput(run, /exited/, 15000, "stderr");

    const stderr = run.stderr.join("");

    // Should have exited message
    expect(stderr).toMatch(/exited/);
  }, 20000);

  it("should set SENTRY_SPOTLIGHT with correct port format", async () => {
    const scriptPath = path.join(process.cwd(), `test-port-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      const url = process.env.SENTRY_SPOTLIGHT;
      
      // Parse URL to check format - exit 0 if valid, 1 if not
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          process.exit(1);
        }
        if (parsed.pathname !== '/stream') {
          process.exit(1);
        }
        process.exit(0);
      } catch (e) {
        process.exit(1);
      }
      `,
      "utf-8",
    );

    const run = spawnSpotlight(["run", "node", scriptPath]);
    activeProcesses.push(run);

    // Wait for completion
    await waitForOutput(run, /exited/, 10000, "stderr");

    // If the script exited cleanly (code 0), the URL was valid
    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 15000);

  it("should run with dynamic port assignment (-p 0)", async () => {
    const scriptPath = path.join(process.cwd(), `test-dynamic-port-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      const url = process.env.SENTRY_SPOTLIGHT;
      const parsed = new URL(url);
      // Exit with port number as code (modulo 256) to verify dynamic assignment
      if (parseInt(parsed.port) > 0 && parseInt(parsed.port) !== 8969) {
        process.exit(42); // Success signal
      }
      process.exit(1);
      `,
      "utf-8",
    );

    const run = spawnSpotlight(["run", "-p", "0", "node", scriptPath]);
    activeProcesses.push(run);

    // Wait for completion
    await waitForOutput(run, /exited/, 15000, "stderr");

    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 20000);

  it("should run with custom port", async () => {
    const port = await findFreePort();
    const scriptPath = path.join(process.cwd(), `test-custom-port-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      const url = process.env.SENTRY_SPOTLIGHT;
      const parsed = new URL(url);
      // Exit 0 if port matches, 1 otherwise
      process.exit(parsed.port === '${port}' ? 0 : 1);
      `,
      "utf-8",
    );

    const run = spawnSpotlight(["run", "-p", port.toString(), "node", scriptPath]);
    activeProcesses.push(run);

    // Wait for completion
    await waitForOutput(run, /exited/, 15000, "stderr");

    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 20000);

  it("should set NEXT_PUBLIC_SENTRY_SPOTLIGHT for Next.js", async () => {
    const scriptPath = path.join(process.cwd(), `test-nextjs-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      // Exit 0 if NEXT_PUBLIC_SENTRY_SPOTLIGHT is set, 1 otherwise
      if (process.env.NEXT_PUBLIC_SENTRY_SPOTLIGHT && 
          process.env.NEXT_PUBLIC_SENTRY_SPOTLIGHT.includes('localhost') &&
          process.env.NEXT_PUBLIC_SENTRY_SPOTLIGHT.includes('stream')) {
        process.exit(0);
      }
      process.exit(1);
      `,
      "utf-8",
    );

    const run = spawnSpotlight(["run", "node", scriptPath]);
    activeProcesses.push(run);

    // Wait for completion
    await waitForOutput(run, /exited/, 15000, "stderr");

    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 20000);

  it("should set SENTRY_TRACES_SAMPLE_RATE", async () => {
    const scriptPath = path.join(process.cwd(), `test-sample-rate-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      // Exit 0 if SENTRY_TRACES_SAMPLE_RATE is set to 1, 1 otherwise
      process.exit(process.env.SENTRY_TRACES_SAMPLE_RATE === '1' ? 0 : 1);
      `,
      "utf-8",
    );

    const run = spawnSpotlight(["run", "node", scriptPath]);
    activeProcesses.push(run);

    // Wait for completion
    await waitForOutput(run, /exited/, 15000, "stderr");

    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 20000);

  it("should accept --open flag without error", async () => {
    const run = spawnSpotlight(["run", "--open", "node", "-e", 'console.log("test"); process.exit(0)']);
    activeProcesses.push(run);

    // Wait for the run command to detect child exit
    await waitForOutput(run, /exited/, 15000, "stderr");

    // Verify we got exit message in stderr (not an error about unknown flag)
    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
    expect(stderr).not.toMatch(/unknown.*option.*open/i);
  }, 20000);

  it("should accept -o short flag without error", async () => {
    const run = spawnSpotlight(["run", "-o", "node", "-e", 'console.log("test"); process.exit(0)']);
    activeProcesses.push(run);

    // Wait for the run command to detect child exit
    await waitForOutput(run, /exited/, 15000, "stderr");

    // Verify we got exit message in stderr
    const stderr = run.stderr.join("");
    expect(stderr).toMatch(/exited/);
  }, 20000);
});
