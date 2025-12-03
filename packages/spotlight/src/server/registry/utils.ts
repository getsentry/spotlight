import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pidusage from "pidusage";
import type { HealthStatus, InstanceMetadata } from "./types.ts";

/**
 * Get the registry directory path
 */
export function getRegistryDir(): string {
  const user = process.env.USER || process.env.USERNAME || "default";
  return join(tmpdir(), `spotlight-${user}`, "instances");
}

/**
 * Get the path for an instance metadata file
 */
export function getInstancePath(instanceId: string): string {
  return join(getRegistryDir(), `instance_${instanceId}.json`);
}

/**
 * Ensure the registry directory exists
 */
export async function ensureRegistryDir(): Promise<void> {
  const dir = getRegistryDir();
  try {
    await mkdir(dir, { recursive: true, mode: 0o700 });
  } catch (err) {
    // Directory might already exist, that's okay
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
      throw err;
    }
  }
}

/**
 * Verify if a PID is valid by checking both existence and start time
 * This prevents false positives from PID reuse
 */
export async function isPIDValid(pid: number, expectedStartTime: number): Promise<boolean> {
  try {
    const stats = await pidusage(pid);
    const actualStartTime = stats.timestamp - stats.elapsed;
    // Allow 1s tolerance for timing differences
    return Math.abs(actualStartTime - expectedStartTime) < 1000;
  } catch {
    return false; // Process doesn't exist
  }
}

/**
 * Check the health status of an instance
 */
export async function checkInstanceHealth(instance: InstanceMetadata): Promise<HealthStatus> {
  // 1. Try healthcheck endpoint first (fastest if responsive)
  try {
    const response = await fetch(`http://localhost:${instance.port}/health`, {
      signal: AbortSignal.timeout(1000),
    });
    if (response.ok) {
      return "healthy";
    }
  } catch {
    // Continue to PID verification
  }

  // 2. Verify PIDs with start time (handles PID reuse)
  const spotlightAlive = await isPIDValid(instance.pid, instance.pidStartTime);
  const childAlive = instance.childPid !== null && instance.childPidStartTime !== null 
    ? await isPIDValid(instance.childPid, instance.childPidStartTime)
    : false;

  if (spotlightAlive && childAlive) {
    return "unresponsive"; // Processes alive but not responding
  }
  if (!spotlightAlive && !childAlive) {
    return "dead"; // Both dead - clean up
  }
  if (spotlightAlive && !childAlive) {
    // If there's no child process, spotlight is healthy
    if (instance.childPid === null) {
      return "unresponsive"; // No child, but server not responding
    }
    return "dead"; // Child died, consider dead
  }
  if (!spotlightAlive && childAlive) {
    return "orphaned"; // Child orphaned - spotlight crashed
  }

  return "dead";
}

/**
 * Write instance metadata atomically
 */
export async function writeInstanceMetadata(metadata: InstanceMetadata): Promise<void> {
  await ensureRegistryDir();
  const path = getInstancePath(metadata.instanceId);
  const tempPath = `${path}.tmp`;
  
  await writeFile(tempPath, JSON.stringify(metadata, null, 2), "utf-8");
  // Atomic rename
  await writeFile(path, await readFile(tempPath, "utf-8"), "utf-8");
  await unlink(tempPath).catch(() => {}); // Ignore errors if already gone
}

/**
 * Read instance metadata from file
 */
export async function readInstanceMetadata(instanceId: string): Promise<InstanceMetadata | null> {
  try {
    const path = getInstancePath(instanceId);
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as InstanceMetadata;
  } catch {
    return null;
  }
}

/**
 * Delete instance metadata file
 */
export async function deleteInstanceMetadata(instanceId: string): Promise<void> {
  try {
    const path = getInstancePath(instanceId);
    await unlink(path);
  } catch {
    // Ignore errors if file doesn't exist
  }
}

/**
 * List all instance metadata files
 */
export async function listInstanceFiles(): Promise<string[]> {
  try {
    await ensureRegistryDir();
    const files = await readdir(getRegistryDir());
    return files
      .filter(f => f.startsWith("instance_") && f.endsWith(".json"))
      .map(f => f.replace("instance_", "").replace(".json", ""));
  } catch {
    return [];
  }
}

/**
 * Get process start time for current process or a given PID
 */
export async function getProcessStartTime(pid?: number): Promise<number> {
  const targetPid = pid ?? process.pid;
  const stats = await pidusage(targetPid);
  return stats.timestamp - stats.elapsed;
}
