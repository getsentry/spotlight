import { type ChildProcess, spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Find an available port dynamically
 */
export async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const { port } = address;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Unable to get port"));
      }
    });
  });
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Kill a process and wait for it to exit
 */
export async function killProcess(proc: ChildProcess, signal: NodeJS.Signals = "SIGTERM"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!proc.pid) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      if (proc.pid) {
        proc.kill("SIGKILL");
      }
      reject(new Error("Process did not exit gracefully"));
    }, 5000);

    proc.on("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    proc.kill(signal);
  });
}

/**
 * Spawn a process with stdio capture
 */
export interface SpawnResult {
  process: ChildProcess;
  stdout: string[];
  stderr: string[];
  exitCode: number | null;
  exitPromise: Promise<number | null>;
}

export function spawnProcess(command: string, args: string[] = [], env: NodeJS.ProcessEnv = {}): SpawnResult {
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode: number | null = null;

  const proc = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  proc.stdout?.on("data", (data: Buffer) => {
    stdout.push(data.toString());
  });

  proc.stderr?.on("data", (data: Buffer) => {
    stderr.push(data.toString());
  });

  const exitPromise = new Promise<number | null>(resolve => {
    proc.on("exit", code => {
      exitCode = code;
      resolve(code);
    });
  });

  return {
    process: proc,
    stdout,
    stderr,
    exitCode,
    exitPromise,
  };
}

/**
 * Get path to a fixture file
 */
export function getFixturePath(filename: string): string {
  return path.join(__dirname, "../../../_fixtures", filename);
}

/**
 * Wait for a string pattern to appear in process output
 */
export async function waitForOutputPattern(
  output: string[],
  pattern: string | RegExp,
  timeout = 5000,
): Promise<string> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const allOutput = output.join("");
    const match = typeof pattern === "string" ? allOutput.includes(pattern) : pattern.test(allOutput);

    if (match) {
      return allOutput;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout waiting for pattern: ${pattern}`);
}

/**
 * Get the spotlight binary path
 */
export function getSpotlightBinPath(): string {
  // In development, use the source files with ts-node
  // In tests, this should point to the built binary
  return path.join(__dirname, "../../../dist/run.js");
}

/**
 * Check if spotlight binary exists
 */
export async function ensureSpotlightBuilt(): Promise<void> {
  const binPath = getSpotlightBinPath();
  const fs = await import("node:fs/promises");
  try {
    await fs.access(binPath);
  } catch {
    throw new Error(`Spotlight binary not found at ${binPath}. Run 'pnpm build' first.`);
  }
}
