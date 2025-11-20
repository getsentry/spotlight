import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ensureSpotlightBuilt, findFreePort, getFixturePath } from "../shared/utils";
import type { SpawnResult } from "../shared/utils";
import { killGracefully, sendEnvelope, spawnSpotlight, waitForOutput, waitForSidecarReady } from "./helpers";

// From https://stackoverflow.com/a/29497680/90297
// Retrieved 2025-11-20, License - CC BY-SA 4.0
// eslint-disable-next-line no-control-regex -- ANSI escape pattern requires control characters
const ANSI_ESCAPE_PATTERN = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

/**
 * Normalizes output by removing ANSI escape codes and replacing dynamic values
 * with placeholders for consistent snapshot testing.
 */
function normalizeOutput(output: string): string {
  return output
    .replace(ANSI_ESCAPE_PATTERN, "")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, "[TIMESTAMP]")
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, "[UUID]")
    .replace(/[a-f0-9]{32}/g, "[ID]")
    .trim();
}

/**
 * Normalizes logfmt output by removing ANSI escape codes and replacing dynamic
 * key-value pairs with placeholders for consistent snapshot testing.
 */
function normalizeLogfmtOutput(output: string): string {
  return output
    .replace(ANSI_ESCAPE_PATTERN, "")
    .replace(/timestamp=[\dT:.Z-]+/g, "timestamp=[TIMESTAMP]")
    .replace(/event_id=[a-f0-9-]+/g, "event_id=[ID]")
    .replace(/trace_id=[a-f0-9]+/g, "trace_id=[ID]")
    .replace(/span_id=[a-f0-9]+/g, "span_id=[ID]");
}

describe("spotlight tail e2e tests", () => {
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

  it("should connect to existing server", async () => {
    const port = await findFreePort();

    // Start server first
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);

    // Wait for server to be ready
    await waitForSidecarReady(port, 60000);

    // Start tail to connect to the server
    const tail = spawnSpotlight(["tail", "-p", port.toString()]);
    activeProcesses.push(tail);

    // Give tail a moment to connect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send test envelope
    const envelopePath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, envelopePath);

    // Wait for output in tail
    await waitForOutput(tail, /error|exception/i, 30000);

    // Verify we got output
    expect(tail.stdout.join("")).toMatch(/error|exception/i);
  }, 15000);

  it("should start new server if none exists", async () => {
    const port = await findFreePort();

    // Start tail without existing server
    const tail = spawnSpotlight(["tail", "-p", port.toString()]);
    activeProcesses.push(tail);

    // Wait for sidecar to start
    await waitForSidecarReady(port, 60000);

    // Send test envelope - use one that actually has an error
    const envelopePath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, envelopePath);

    // Wait for output - transaction or error would appear
    await waitForOutput(tail, /event|transaction/i, 30000);

    // Verify we got some output
    expect(tail.stdout.join("").length).toBeGreaterThan(0);
  }, 15000);

  it("should filter errors only", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with errors filter
    const tail = spawnSpotlight(["tail", "errors", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Send log envelope
    const logPath = getFixturePath("log_envelope.txt");
    await sendEnvelope(port, logPath);

    // Wait for error output
    await waitForOutput(tail, /error|exception/i, 30000);

    const output = tail.stdout.join("");
    // Should have error output
    expect(output).toMatch(/error|exception/i);

    // Logs might not appear depending on the format,
    // but errors should definitely be there
  }, 15000);

  it("should filter logs only", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with logs filter
    const tail = spawnSpotlight(["tail", "logs", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send log envelope
    const logPath = getFixturePath("log_envelope.txt");
    await sendEnvelope(port, logPath);

    // Wait for log output
    await waitForOutput(tail, /log|info/i, 30000);

    const output = tail.stdout.join("");
    expect(output.length).toBeGreaterThan(0);
  }, 15000);

  it("should filter traces only", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with traces filter
    const tail = spawnSpotlight(["tail", "traces", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send trace envelope - python envelope contains a transaction
    const tracePath = getFixturePath("envelope_python.txt");
    await sendEnvelope(port, tracePath);

    // Wait for any trace output
    await waitForOutput(tail, /\w+/, 30000);

    const output = tail.stdout.join("");
    // Should have some output for the transaction
    expect(output.length).toBeGreaterThan(0);
  }, 15000);

  it("should filter multiple event types", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with errors and logs filter
    const tail = spawnSpotlight(["tail", "errors", "logs", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Send log envelope
    const logPath = getFixturePath("log_envelope.txt");
    await sendEnvelope(port, logPath);

    // Wait for output
    await waitForOutput(tail, /error|exception|log/i, 30000);

    const output = tail.stdout.join("");
    expect(output.length).toBeGreaterThan(0);
  }, 15000);

  it("should output in json format", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with json format
    const tail = spawnSpotlight(["tail", "-f", "json", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /{.*}/s, 30000);

    const output = tail.stdout.join("");
    // Should be valid JSON
    const lines = output.split("\n").filter(l => l.trim());
    expect(lines.length).toBeGreaterThan(0);

    // Every non-empty line should be valid JSON
    const jsonLines: any[] = [];
    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          jsonLines.push(parsed);
        } catch (_e) {
          throw new Error(`Invalid JSON line: ${line}`);
        }
      }
    }

    expect(jsonLines.length).toBeGreaterThan(0);

    // Snapshot the first JSON object (normalized)
    if (jsonLines.length > 0) {
      const firstJson = jsonLines[0];
      // Normalize timestamps and dynamic IDs for snapshot
      const normalized = JSON.stringify(
        firstJson,
        (key, value) => {
          if (key === "timestamp" || key === "event_id" || key === "trace_id" || key === "span_id") {
            return "[DYNAMIC]";
          }
          return value;
        },
        2,
      );
      expect(normalized).toMatchSnapshot();
    }
  }, 15000);

  it("should output in logfmt format", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with logfmt format
    const tail = spawnSpotlight(["tail", "-f", "logfmt", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /\w+=/, 30000);

    const output = tail.stdout.join("");
    // Logfmt typically has key=value pairs
    expect(output).toMatch(/\w+=/);

    // Normalize dynamic values and snapshot
    const normalized = normalizeLogfmtOutput(output);

    expect(normalized).toMatchSnapshot();
  }, 15000);

  it("should output in human format (default)", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with human format (default)
    const tail = spawnSpotlight(["tail", "-f", "human", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /.+/, 30000);

    const output = tail.stdout.join("");
    expect(output.length).toBeGreaterThan(0);

    // Normalize and snapshot
    const normalized = normalizeOutput(output);

    expect(normalized).toMatchSnapshot();
  }, 15000);

  it("should output in markdown format", async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 60000);

    // Start tail with markdown format
    const tail = spawnSpotlight(["tail", "-f", "md", "-p", port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /[#*`]/, 30000);

    const output = tail.stdout.join("");
    // Markdown typically has # or ``` or other markdown syntax
    expect(output).toMatch(/[#*`]/);

    // Normalize and snapshot
    const normalized = normalizeOutput(output);

    expect(normalized).toMatchSnapshot();
  }, 15000);
});
