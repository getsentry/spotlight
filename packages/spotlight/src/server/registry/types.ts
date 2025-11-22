/**
 * Metadata for a registered Spotlight instance
 */
export type InstanceMetadata = {
  instanceId: string;
  port: number;
  pid: number;
  pidStartTime: number;
  childPid: number | null;
  childPidStartTime: number | null;
  command: string;
  cmdArgs: string[];
  cwd: string;
  startTime: string;
  projectName: string;
  detectedType: string;
};

/**
 * Health status of an instance
 */
export type HealthStatus = "healthy" | "unresponsive" | "dead" | "orphaned";

/**
 * Instance information with health status
 */
export type InstanceInfo = InstanceMetadata & {
  status: HealthStatus;
  uptime?: number;
};
