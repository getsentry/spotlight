import { logger } from "../logger.ts";
import type { InstanceInfo, InstanceMetadata } from "./types.ts";
import {
  checkInstanceHealth,
  deleteInstanceMetadata,
  listInstanceFiles,
  readInstanceMetadata,
  writeInstanceMetadata,
} from "./utils.ts";

/**
 * Manager for the instance registry
 */
export class InstanceRegistry {
  /**
   * Register a new instance
   */
  async register(metadata: InstanceMetadata): Promise<void> {
    try {
      await writeInstanceMetadata(metadata);
      logger.debug(`Registered instance ${metadata.instanceId} on port ${metadata.port}`);
    } catch (err) {
      logger.error(`Failed to register instance ${metadata.instanceId}: ${err}`);
      throw err;
    }
  }

  /**
   * Unregister an instance
   */
  async unregister(instanceId: string): Promise<void> {
    try {
      await deleteInstanceMetadata(instanceId);
      logger.debug(`Unregistered instance ${instanceId}`);
    } catch (err) {
      logger.error(`Failed to unregister instance ${instanceId}: ${err}`);
    }
  }

  /**
   * List all instances with health check
   * Automatically cleans up stale instances
   */
  async list(includeUnhealthy = false): Promise<InstanceInfo[]> {
    const instanceIds = await listInstanceFiles();
    const instances: InstanceInfo[] = [];

    for (const instanceId of instanceIds) {
      const metadata = await readInstanceMetadata(instanceId);
      if (!metadata) {
        // Corrupted file, skip and try to clean up
        await deleteInstanceMetadata(instanceId);
        continue;
      }

      const status = await checkInstanceHealth(metadata);

      // Clean up dead instances
      if (status === "dead") {
        await this.unregister(instanceId);
        if (!includeUnhealthy) {
          continue;
        }
      }

      // Filter out unresponsive/orphaned unless requested
      if (!includeUnhealthy && (status === "unresponsive" || status === "orphaned")) {
        continue;
      }

      const uptime = Date.now() - new Date(metadata.startTime).getTime();

      instances.push({
        ...metadata,
        status,
        uptime,
      });
    }

    // Sort by start time (newest first)
    instances.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return instances;
  }

  /**
   * Get a specific instance by ID
   */
  async get(instanceId: string): Promise<InstanceInfo | null> {
    const metadata = await readInstanceMetadata(instanceId);
    if (!metadata) {
      return null;
    }

    const status = await checkInstanceHealth(metadata);
    const uptime = Date.now() - new Date(metadata.startTime).getTime();

    return {
      ...metadata,
      status,
      uptime,
    };
  }

  /**
   * Clean up all stale instances
   */
  async cleanup(): Promise<number> {
    const instanceIds = await listInstanceFiles();
    let cleaned = 0;

    for (const instanceId of instanceIds) {
      const metadata = await readInstanceMetadata(instanceId);
      if (!metadata) {
        await deleteInstanceMetadata(instanceId);
        cleaned++;
        continue;
      }

      const status = await checkInstanceHealth(metadata);
      if (status === "dead") {
        await this.unregister(instanceId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} stale instance(s)`);
    }

    return cleaned;
  }

  /**
   * Terminate an instance
   * Returns true if successful, false if instance not found or already dead
   */
  async terminate(instanceId: string): Promise<boolean> {
    const metadata = await readInstanceMetadata(instanceId);
    if (!metadata) {
      return false;
    }

    const status = await checkInstanceHealth(metadata);
    if (status === "dead") {
      await this.unregister(instanceId);
      return false;
    }

    try {
      // Kill spotlight process (this should also kill child)
      if (metadata.pid) {
        try {
          process.kill(metadata.pid, "SIGTERM");
        } catch (err) {
          // Process might already be dead
          logger.debug(`Could not kill spotlight PID ${metadata.pid}: ${err}`);
        }
      }

      // Kill child process if it exists
      if (metadata.childPid) {
        try {
          process.kill(metadata.childPid, "SIGTERM");
        } catch (err) {
          // Process might already be dead
          logger.debug(`Could not kill child PID ${metadata.childPid}: ${err}`);
        }
      }

      // Clean up metadata
      await this.unregister(instanceId);
      
      logger.info(`Terminated instance ${instanceId}`);
      return true;
    } catch (err) {
      logger.error(`Failed to terminate instance ${instanceId}: ${err}`);
      return false;
    }
  }
}

// Singleton instance
let registryInstance: InstanceRegistry | null = null;

/**
 * Get the singleton registry instance
 */
export function getRegistry(): InstanceRegistry {
  if (!registryInstance) {
    registryInstance = new InstanceRegistry();
  }
  return registryInstance;
}
