import { execSync } from "node:child_process";
import { stringify as stringifyYaml } from "yaml";
import { logger } from "../logger.js";
import { findComposeFile, findOverrideFile, parseComposeFile } from "./docker-compose-parser.js";

export const DOCKER_MIN_VERSION = "20.10.0";
export const DOCKER_HOST_INTERNAL = "host.docker.internal";
export const DOCKER_HOST_GATEWAY = "host-gateway";

export interface DockerComposeConfig {
  composeFile: string;
  overrideFile?: string;
  command: string[];
  serviceNames: string[];
}

/**
 * Check if the first version is greater than or equal to the second version
 * Returns true if v1 >= v2
 */
function isVersionGreaterOrEqual(v1: string, v2: string): boolean {
  const parts1 = v1.replace(/^v/, "").split(".").map(Number);
  const parts2 = v2.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return true;
    if (p1 < p2) return false;
  }
  return true;
}

/**
 * Execute a command and return the output, or null if it fails
 */
function tryExec(command: string): string | null {
  try {
    return execSync(command, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

/**
 * Detect if Docker is installed and check its version
 */
export function detectDocker(): { version: string; valid: boolean } | null {
  const version = tryExec("docker --version");
  if (!version) {
    return null;
  }

  const match = version.match(/Docker version ([\d.]+)/);
  if (!match) {
    return null;
  }

  const versionNumber = match[1];
  const valid = isVersionGreaterOrEqual(versionNumber, DOCKER_MIN_VERSION);

  return { version: versionNumber, valid };
}

/**
 * Detect which compose command to use and its version
 * Follows the logic from sentry/self-hosted
 */
function detectComposeCommand(): { command: string[]; version: string } | null {
  const composePluginVersion = tryExec("docker compose version --short");
  const composeStandaloneVersion = tryExec("docker-compose version --short");

  if (!composePluginVersion && !composeStandaloneVersion) {
    return null;
  }

  if (!composePluginVersion && composeStandaloneVersion) {
    return { command: ["docker-compose"], version: composeStandaloneVersion };
  }

  if (composePluginVersion && !composeStandaloneVersion) {
    return { command: ["docker", "compose"], version: composePluginVersion };
  }

  // Use standalone if it's newer, otherwise prefer plugin
  const pluginVer = composePluginVersion!.replace(/^v/, "");
  const standaloneVer = composeStandaloneVersion!.replace(/^v/, "");

  if (isVersionGreaterOrEqual(standaloneVer, pluginVer)) {
    return { command: ["docker-compose"], version: composeStandaloneVersion! };
  }

  return { command: ["docker", "compose"], version: composePluginVersion! };
}

/**
 * Generate the override YAML for injecting Spotlight environment variables
 */
export function generateSpotlightOverrideYaml(serviceNames: string[], port: number): string {
  const services: Record<string, unknown> = {};

  // We use host.docker.internal to ensure the container can access the host machine
  // for backend services that need to access the host machine to send events to the Sidecar.
  const spotlightUrl = `http://${DOCKER_HOST_INTERNAL}:${port}/stream`;
  const publicSpotlightUrl = `http://localhost:${port}/stream`;

  for (const serviceName of serviceNames) {
    services[serviceName] = {
      environment: [
        `SENTRY_SPOTLIGHT=${spotlightUrl}`,
        `NEXT_PUBLIC_SENTRY_SPOTLIGHT=${publicSpotlightUrl}`, // This is needed for Next.js
        "SENTRY_TRACES_SAMPLE_RATE=1",
      ],
      extra_hosts: [`${DOCKER_HOST_INTERNAL}:${DOCKER_HOST_GATEWAY}`],
    };
  }

  return stringifyYaml({ services });
}

/**
 * Build the Docker Compose command with Spotlight environment injection
 */
export function buildDockerComposeCommand(
  config: DockerComposeConfig,
  port: number,
): { cmdArgs: string[]; dockerComposeOverride: string } {
  const cmdArgs = [...config.command];

  cmdArgs.push("-f", config.composeFile);

  if (config.overrideFile) {
    cmdArgs.push("-f", config.overrideFile);
  }

  cmdArgs.push("-f", "-");

  cmdArgs.push("up");

  const dockerComposeOverride = generateSpotlightOverrideYaml(config.serviceNames, port);

  return { cmdArgs, dockerComposeOverride };
}

/**
 * Detect and configure Docker Compose
 *
 * This function orchestrates the detection of Docker, Docker Compose,
 * compose files, and services to build a complete configuration.
 */
export function detectDockerCompose(): DockerComposeConfig | null {
  const docker = detectDocker();
  if (!docker) {
    logger.debug("Docker is not installed or not in PATH");
    return null;
  }

  if (!docker.valid) {
    return null;
  }

  logger.debug(`Detected Docker version ${docker.version}`);

  const compose = detectComposeCommand();
  if (!compose) {
    logger.debug("Docker Compose is not installed or not in PATH");
    return null;
  }

  logger.debug(`Detected Docker Compose version ${compose.version} (${compose.command.join(" ")})`);

  const composeFile = findComposeFile();
  if (!composeFile) {
    logger.debug("No compose file found in current directory");
    return null;
  }

  logger.debug(`Found compose file: ${composeFile}`);

  const serviceNames = parseComposeFile(composeFile);
  if (serviceNames.length === 0) {
    logger.debug("No services found in compose file");
    return null;
  }

  logger.debug(`Found ${serviceNames.length} service(s): ${serviceNames.join(", ")}`);

  const overrideFile = findOverrideFile(composeFile);
  if (overrideFile) {
    logger.debug(`Found override file: ${overrideFile}`);
  }

  return {
    composeFile,
    overrideFile: overrideFile ?? undefined,
    command: compose.command,
    serviceNames,
  };
}
