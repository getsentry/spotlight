import logfmt from "logfmt";
import { formatLogLine } from "../formatters/human/utils.ts";
import { logger } from "../logger.ts";
import { getRegistry } from "../registry/manager.ts";
import type { InstanceInfo } from "../registry/types.ts";
import type { CLIHandlerOptions } from "../types/cli.ts";

/**
 * Format instance info in human-readable format (uses formatLogLine)
 */
function formatHuman(instance: InstanceInfo, isSelf: boolean): string {
  const timestamp = new Date(instance.startTime).getTime() / 1000;
  const projectName = isSelf ? `${instance.projectName} [self]` : instance.projectName;
  const message = `${projectName}@${instance.port} (${instance.command}) - http://localhost:${instance.port}`;
  return formatLogLine(timestamp, "server", "info", message);
}

/**
 * Format instance info in JSON format
 */
function formatJson(instances: InstanceInfo[]): string {
  return JSON.stringify(instances, null, 2);
}

/**
 * Format instance info in logfmt format
 */
function formatLogfmt(instance: InstanceInfo, isSelf: boolean): string {
  const fields: Record<string, string | number | null | boolean> = {
    instanceId: instance.instanceId,
    projectName: instance.projectName,
    port: instance.port,
    command: instance.command,
    cwd: instance.cwd,
    pid: instance.pid,
    childPid: instance.childPid,
    startTime: instance.startTime,
    detectedType: instance.detectedType,
    status: instance.status,
    isSelf,
  };

  if (instance.uptime !== undefined) {
    fields.uptime = Math.floor(instance.uptime / 1000); // seconds
  }

  return logfmt.stringify(fields);
}

/**
 * Format instance info in markdown format
 */
function formatMarkdown(instances: InstanceInfo[], currentPid: number): string {
  const lines: string[] = [];

  // Header
  lines.push("| Project | Port | Command | Started | PID | URL | Status |");
  lines.push("|---------|------|---------|---------|-----|-----|--------|");

  // Rows
  for (const instance of instances) {
    const isSelf = instance.pid === currentPid;
    const projectName = isSelf ? `${instance.projectName} [self]` : instance.projectName;
    const startTime = new Date(instance.startTime).toLocaleString();
    const url = `http://localhost:${instance.port}`;
    const uptime = instance.uptime ? `${Math.floor(instance.uptime / 1000)}s` : "?";

    lines.push(
      `| ${projectName} | ${instance.port} | ${instance.command} | ${startTime} (${uptime}) | ${instance.pid} | ${url} | ${instance.status} |`,
    );
  }

  return lines.join("\n");
}

/**
 * Formatter function type - takes instances and current PID, returns formatted output
 */
type InstanceFormatter = (instances: InstanceInfo[], currentPid: number) => void;

/**
 * Map of format types to their formatter functions
 */
const FORMATTERS = new Map<string, InstanceFormatter>([
  [
    "human",
    (instances, currentPid) => {
      for (const instance of instances) {
        const isSelf = instance.pid === currentPid;
        console.log(formatHuman(instance, isSelf));
      }
    },
  ],
  [
    "json",
    instances => {
      console.log(formatJson(instances));
    },
  ],
  [
    "logfmt",
    (instances, currentPid) => {
      for (const instance of instances) {
        const isSelf = instance.pid === currentPid;
        console.log(formatLogfmt(instance, isSelf));
      }
    },
  ],
  [
    "md",
    (instances, currentPid) => {
      console.log(formatMarkdown(instances, currentPid));
    },
  ],
]);

/**
 * List all registered Spotlight instances
 */
export default async function list({ format = "human" }: CLIHandlerOptions): Promise<void> {
  const includeUnhealthy = process.argv.includes("--all");
  const currentPid = process.pid;

  try {
    const instances = await getRegistry().list(includeUnhealthy);

    if (instances.length === 0) {
      logger.info("No Spotlight instances are currently running.");
      return;
    }

    const formatter = FORMATTERS.get(format);
    if (!formatter) {
      logger.error(`Unsupported format: ${format}`);
      process.exit(1);
    }

    formatter(instances, currentPid);
  } catch (err) {
    logger.error(`Failed to list instances: ${err}`);
    process.exit(1);
  }
}
