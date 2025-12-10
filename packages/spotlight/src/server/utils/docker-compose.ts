import { execSync } from "node:child_process";
import semver from "semver";
import { stringify as stringifyYaml } from "yaml";
import { logger } from "../logger.ts";
import {
  findComposeFile,
  findOverrideFile,
  getComposeFilesFromEnv,
  getDockerComposeServices,
} from "./docker-compose-parser.ts";

// minimum version of Docker required to use host.docker.internal on linux
/// https://docs.docker.com/engine/release-notes/20.10/#bug-fixes-and-enhancements-1
export const DOCKER_MIN_VERSION = "20.10.0";
export const DOCKER_HOST_INTERNAL = "host.docker.internal";
export const DOCKER_HOST_GATEWAY = "host-gateway";

interface DockerComposeConfig {
  composeFiles: string[]; // Array of compose files
  command: string[];
  serviceNames: string[];
  upArgs: string[]; // Arguments after 'up' (e.g., -d, --build, service names)
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
  const valid = semver.gte(versionNumber, DOCKER_MIN_VERSION);

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

  if (!composePluginVersion) {
    return { command: ["docker-compose"], version: composeStandaloneVersion! };
  }

  if (!composeStandaloneVersion) {
    return { command: ["docker", "compose"], version: composePluginVersion! };
  }

  // Use standalone if it's newer, otherwise prefer plugin
  const pluginVer = composePluginVersion.replace(/^v/, "");
  const standaloneVer = composeStandaloneVersion.replace(/^v/, "");

  if (semver.gt(standaloneVer, pluginVer)) {
    return { command: ["docker-compose"], version: composeStandaloneVersion };
  }

  return { command: ["docker", "compose"], version: composePluginVersion };
}

/**
 * Generate the override YAML for injecting Spotlight environment variables
 */
function generateSpotlightOverrideYaml(serviceNames: string[]): string {
  const services: Record<string, { environment: string[]; extra_hosts: string[] }> = {};
  // Pass environment variables without values to inherit from parent process (run.ts)
  // so the values set in run.ts are propagated correctly
  for (const serviceName of serviceNames) {
    services[serviceName] = {
      environment: ["SENTRY_SPOTLIGHT", "NEXT_PUBLIC_SENTRY_SPOTLIGHT", "SENTRY_TRACES_SAMPLE_RATE"],
      extra_hosts: [`${DOCKER_HOST_INTERNAL}:${DOCKER_HOST_GATEWAY}`],
    };
  }

  return stringifyYaml({ services });
}

/**
 * Resolve compose files to use, with the following priority:
 * 1. User-specified files (from -f flags)
 * 2. COMPOSE_FILE environment variable
 * 3. Auto-detect compose file + override file
 */
function resolveComposeFiles(userSpecifiedFiles?: string[]): string[] | null {
  if (userSpecifiedFiles && userSpecifiedFiles.length > 0) {
    logger.debug(`Using user-specified compose files: ${userSpecifiedFiles.join(", ")}`);
    return userSpecifiedFiles;
  }

  const fromEnv = getComposeFilesFromEnv();
  if (fromEnv) {
    logger.debug(`Using COMPOSE_FILE environment variable: ${fromEnv.join(", ")}`);
    return fromEnv;
  }

  const composeFile = findComposeFile();
  if (!composeFile) {
    logger.debug("No compose file found");
    return null;
  }

  logger.debug(`Found compose file: ${composeFile}`);
  const files = [composeFile];

  const overrideFile = findOverrideFile(composeFile);
  if (overrideFile) {
    logger.debug(`Found override file: ${overrideFile}`);
    files.push(overrideFile);
  }

  return files;
}

/**
 * Collect and deduplicate service names from compose files
 */
function collectServices(composeFiles: string[]): string[] {
  const serviceSet = new Set<string>();
  for (const file of composeFiles) {
    for (const service of getDockerComposeServices(file)) {
      serviceSet.add(service);
    }
  }
  return Array.from(serviceSet);
}

/**
 * Parse -f/--file flags from command arguments
 */
function parseComposeFileFlags(args: string[]): string[] {
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-f" || arg === "--file") {
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        files.push(next);
        i++;
      }
    } else if (arg.startsWith("-f=") || arg.startsWith("--file=")) {
      const file = arg.split("=")[1];
      if (file) {
        files.push(file);
      }
    }
  }
  return files;
}

/**
 * Build the Docker Compose command with Spotlight environment injection
 */
export function buildDockerComposeCommand(config: DockerComposeConfig): {
  cmdArgs: string[];
  stdin: string;
} {
  const cmdArgs = [...config.command];

  // Add -f for each compose file
  for (const file of config.composeFiles) {
    cmdArgs.push("-f", file);
  }

  // Add our Spotlight override last
  cmdArgs.push("-f", "-");
  cmdArgs.push("up");

  // Add any arguments that were provided after 'up' (e.g., -d, --build, service names)
  if (config.upArgs && config.upArgs.length > 0) {
    cmdArgs.push(...config.upArgs);
  }

  const stdin = generateSpotlightOverrideYaml(config.serviceNames);

  return { cmdArgs, stdin };
}

/**
 * Prepare Docker Compose run by configuring environment and building command
 *
 * This helper sets up the SENTRY_SPOTLIGHT URL to use host.docker.internal
 * (so containers can reach the host machine), builds the compose command,
 * and removes COMPOSE_FILE from env to avoid conflicts with explicit -f flags.
 */
export function prepareDockerComposeRun(
  config: DockerComposeConfig,
  serverPort: number,
  env: Record<string, string | undefined>,
): { cmdArgs: string[]; stdin: string } {
  env.SENTRY_SPOTLIGHT = `http://${DOCKER_HOST_INTERNAL}:${serverPort}/stream`;
  const command = buildDockerComposeCommand(config);
  // biome-ignore lint/performance/noDelete: need to remove env var entirely
  delete env.COMPOSE_FILE;
  return command;
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
    logger.error(`Docker version ${docker.version} does not meet the minimum required version ${DOCKER_MIN_VERSION}`);
    return null;
  }

  logger.debug(`Detected Docker version ${docker.version}`);

  const compose = detectComposeCommand();
  if (!compose) {
    logger.debug("Docker Compose is not installed or not in PATH");
    return null;
  }

  logger.debug(`Detected Docker Compose version ${compose.version} (${compose.command.join(" ")})`);

  const composeFiles = resolveComposeFiles();
  if (!composeFiles) {
    return null;
  }

  const serviceNames = collectServices(composeFiles);
  if (serviceNames.length === 0) {
    logger.debug("No services found in compose file(s)");
    return null;
  }

  logger.debug(`Found ${serviceNames.length} service(s): ${serviceNames.join(", ")}`);

  return {
    composeFiles,
    command: compose.command,
    serviceNames,
    upArgs: [], // No extra args when auto-detecting
  };
}

/**
 * Parse an explicit Docker Compose command from cmdArgs
 *
 * This handles cases where the user runs:
 * - `spotlight run docker compose up`
 * - `spotlight run docker-compose up`
 * - `spotlight run docker compose -f custom.yml up`
 *
 * Returns a DockerComposeConfig if the command is a docker compose up command,
 * null otherwise.
 */
export function parseExplicitDockerComposeUp(cmdArgs: string[]): DockerComposeConfig | null {
  if (cmdArgs.length < 2) {
    return null;
  }

  let command: string[];
  let argsStartIndex: number;

  if (cmdArgs[0] === "docker-compose") {
    command = ["docker-compose"];
    argsStartIndex = 1;
  } else if (cmdArgs[0] === "docker" && cmdArgs[1] === "compose") {
    command = ["docker", "compose"];
    argsStartIndex = 2;
  } else {
    return null;
  }

  const remainingArgs = cmdArgs.slice(argsStartIndex);
  const upIndex = remainingArgs.indexOf("up");
  if (upIndex === -1) {
    logger.debug("Not a 'docker compose up' command, skipping Spotlight injection");
    return null;
  }

  const argsBeforeUp = remainingArgs.slice(0, upIndex);
  const argsAfterUp = remainingArgs.slice(upIndex + 1);
  const userFiles = parseComposeFileFlags(argsBeforeUp);

  const composeFiles = resolveComposeFiles(userFiles.length > 0 ? userFiles : undefined);
  if (!composeFiles) {
    return null;
  }

  const serviceNames = collectServices(composeFiles);
  if (serviceNames.length === 0) {
    logger.debug("No services found in compose file(s)");
    return null;
  }

  logger.debug(`Found ${serviceNames.length} service(s): ${serviceNames.join(", ")}`);

  return {
    composeFiles,
    command,
    serviceNames,
    upArgs: argsAfterUp,
  };
}
