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

  const stdin = generateSpotlightOverrideYaml(config.serviceNames);

  return { cmdArgs, stdin };
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

  // First check if COMPOSE_FILE env is set
  const composeFilesFromEnv = getComposeFilesFromEnv();
  let composeFiles: string[];

  if (composeFilesFromEnv) {
    // Use files from COMPOSE_FILE env variable
    composeFiles = composeFilesFromEnv;
    logger.debug(`Using COMPOSE_FILE environment variable: ${composeFiles.join(", ")}`);
  } else {
    // Use existing findComposeFile() + findOverrideFile() logic
    const composeFile = findComposeFile();
    if (!composeFile) {
      logger.debug("No compose file found in current directory");
      return null;
    }

    logger.debug(`Found compose file: ${composeFile}`);

    composeFiles = [composeFile];

    // Check for override file (only when COMPOSE_FILE is not set)
    const overrideFile = findOverrideFile(composeFile);
    if (overrideFile) {
      logger.debug(`Found override file: ${overrideFile}`);
      composeFiles.push(overrideFile);
    }
  }

  // Parse services from all compose files using the refactored function
  const serviceNamesSet = new Set<string>();
  for (const file of composeFiles) {
    const services = getDockerComposeServices(file);
    for (const service of services) {
      serviceNamesSet.add(service);
    }
  }

  const serviceNames = Array.from(serviceNamesSet);
  if (serviceNames.length === 0) {
    logger.debug("No services found in compose file(s)");
    return null;
  }

  logger.debug(`Found ${serviceNames.length} service(s): ${serviceNames.join(", ")}`);

  return {
    composeFiles,
    command: compose.command,
    serviceNames,
  };
}
