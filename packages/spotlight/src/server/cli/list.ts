import { formatLogLine } from "../formatters/human/utils.ts";
import { logger } from "../logger.ts";
import { getRegistry } from "../registry/manager.ts";
import type { InstanceInfo } from "../registry/types.ts";
import type { CLIHandlerOptions } from "../types/cli.ts";

/**
 * Format instance info in human-readable format (uses formatLogLine)
 */
function formatHuman(instance: InstanceInfo): string {
  const timestamp = new Date(instance.startTime).getTime() / 1000;
  const message = `${instance.projectName}@${instance.port} (${instance.command}) - http://localhost:${instance.port}`;
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
function formatLogfmt(instance: InstanceInfo): string {
  const fields: Record<string, string | number> = {
    instanceId: instance.instanceId,
    projectName: instance.projectName,
    port: instance.port,
    command: `"${instance.command.replace(/"/g, '\\"')}"`,
    cwd: instance.cwd,
    pid: instance.pid,
    childPid: instance.childPid || "null",
    startTime: instance.startTime,
    detectedType: instance.detectedType,
    status: instance.status,
  };

  if (instance.uptime !== undefined) {
    fields.uptime = Math.floor(instance.uptime / 1000); // seconds
  }

  return Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
}

/**
 * Format instance info in markdown format
 */
function formatMarkdown(instances: InstanceInfo[]): string {
  const lines: string[] = [];
  
  // Header
  lines.push("| Project | Port | Command | Started | PID | URL | Status |");
  lines.push("|---------|------|---------|---------|-----|-----|--------|");
  
  // Rows
  for (const instance of instances) {
    const startTime = new Date(instance.startTime).toLocaleString();
    const url = `http://localhost:${instance.port}`;
    const uptime = instance.uptime ? `${Math.floor(instance.uptime / 1000)}s` : "?";
    
    lines.push(
      `| ${instance.projectName} | ${instance.port} | ${instance.command} | ${startTime} (${uptime}) | ${instance.pid} | ${url} | ${instance.status} |`
    );
  }
  
  return lines.join("\n");
}

/**
 * List all registered Spotlight instances
 */
export default async function list({ format = "human" }: CLIHandlerOptions): Promise<void> {
  const includeUnhealthy = process.argv.includes("--all");
  
  try {
    const instances = await getRegistry().list(includeUnhealthy);

    if (instances.length === 0) {
      logger.info("No Spotlight instances are currently running.");
      return;
    }

    switch (format) {
      case "human":
        for (const instance of instances) {
          console.log(formatHuman(instance));
        }
        break;

      case "json":
        console.log(formatJson(instances));
        break;

      case "logfmt":
        for (const instance of instances) {
          console.log(formatLogfmt(instance));
        }
        break;

      case "md":
        console.log(formatMarkdown(instances));
        break;

      default:
        logger.error(`Unsupported format: ${format}`);
        process.exit(1);
    }
  } catch (err) {
    logger.error(`Failed to list instances: ${err}`);
    process.exit(1);
  }
}
