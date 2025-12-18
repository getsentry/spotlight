import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ensureSpotlightBuilt, findFreePort } from "../shared/utils";
import type { SpawnResult } from "../shared/utils";
import { killGracefully, spawnSpotlight, waitForSidecarReady } from "./helpers";

describe("spotlight server e2e tests", () => {
  const activeProcesses: SpawnResult[] = [];

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
  });

  it("should start server on default port", async () => {
    const port = await findFreePort();

    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);

    await waitForSidecarReady(port, 10000);

    // Server should be running - we can verify by checking stderr for listening message
    const stderr = server.stderr.join("");
    expect(stderr).toMatch(/listening/i);
  }, 15000);

  it("should accept --open flag without error", async () => {
    const port = await findFreePort();

    // Start server with --open flag
    // Note: In CI/test environment, the browser won't actually open,
    // but the command should not error
    const server = spawnSpotlight(["server", "-p", port.toString(), "--open"]);
    activeProcesses.push(server);

    await waitForSidecarReady(port, 10000);

    // Server should be running despite --open flag (even if browser doesn't open)
    const stderr = server.stderr.join("");
    expect(stderr).toMatch(/listening/i);
    // Should not have any errors about unknown flags
    expect(stderr).not.toMatch(/unknown.*option.*open/i);
  }, 15000);

  it("should accept -o short flag without error", async () => {
    const port = await findFreePort();

    // Start server with -o flag
    const server = spawnSpotlight(["server", "-p", port.toString(), "-o"]);
    activeProcesses.push(server);

    await waitForSidecarReady(port, 10000);

    // Server should be running
    const stderr = server.stderr.join("");
    expect(stderr).toMatch(/listening/i);
  }, 15000);

  it("should work with combined flags including --open", async () => {
    const port = await findFreePort();

    // Start server with multiple flags
    const server = spawnSpotlight(["-p", port.toString(), "-d", "--open"]);
    activeProcesses.push(server);

    await waitForSidecarReady(port, 10000);

    // Server should be running
    const stderr = server.stderr.join("");
    expect(stderr).toMatch(/listening/i);
  }, 15000);
});
