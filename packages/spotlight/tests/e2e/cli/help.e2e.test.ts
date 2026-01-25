import { beforeAll, describe, expect, it } from "vitest";
import { ensureSpotlightBuilt } from "../shared/utils";
import { spawnSpotlight } from "./helpers";

describe("spotlight help e2e tests", () => {
  beforeAll(async () => {
    await ensureSpotlightBuilt();
  });

  it("should show --allowed-origin option in main help", async () => {
    const proc = spawnSpotlight(["--help"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("-A,");
    expect(stdout).toContain("Additional origins to allow for CORS requests");
  });

  it("should show --allowed-origin option in server command help", async () => {
    const proc = spawnSpotlight(["server", "--help"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("-A,");
    expect(stdout).toContain("Additional origins to allow for CORS requests");
  });

  it("should show --allowed-origin option in help server command", async () => {
    const proc = spawnSpotlight(["help", "server"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("-A,");
  });

  it("should show all global options in command-specific help", async () => {
    const proc = spawnSpotlight(["server", "--help"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    // All global options should be present
    expect(stdout).toContain("--port");
    expect(stdout).toContain("--open");
    expect(stdout).toContain("--debug");
    expect(stdout).toContain("--format");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("--help");
  });

  it("should show options in tail command help", async () => {
    const proc = spawnSpotlight(["tail", "--help"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("--port");
  });

  it("should show options in mcp command help", async () => {
    const proc = spawnSpotlight(["mcp", "--help"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("--port");
  });

  it("should show options in run command help", async () => {
    const proc = spawnSpotlight(["run", "--help"]);
    const exitCode = await proc.exitPromise;

    expect(exitCode).toBe(0);

    const stdout = proc.stdout.join("");
    expect(stdout).toContain("--allowed-origin");
    expect(stdout).toContain("--port");
  });
});
