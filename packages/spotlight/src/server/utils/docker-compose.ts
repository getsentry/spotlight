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
  subcommandArgs: string[]; // Subcommand and its arguments (e.g., up -d --build, logs -f, exec web bash)
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
 * Validate Docker is installed and meets minimum version requirement.
 * Logs appropriate messages on failure.
 */
function validateDocker(): boolean {
  const docker = detectDocker();
  if (!docker) {
    logger.debug("Docker is not installed or not in PATH");
    return false;
  }

  if (!docker.valid) {
    logger.error(`Docker version ${docker.version} does not meet the minimum required version ${DOCKER_MIN_VERSION}`);
    return false;
  }

  logger.debug(`Detected Docker version ${docker.version}`);
  return true;
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

const FILE_FLAGS = ["-f", "--file"];

/**
 * Extract -f/--file flags from global options (before the subcommand).
 * Once we hit the first non-flag argument (the subcommand), everything passes through.
 * This prevents confusing `logs -f` (follow) with `-f file.yml` (compose file).
 */
function parseComposeFlags(args: string[]): { files: string[]; remainingArgs: string[] } {
  const files: string[] = [];
  const remainingArgs: string[] = [];
  let parsingGlobalFlags = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (parsingGlobalFlags) {
      if (FILE_FLAGS.includes(arg) && args[i + 1]) {
        files.push(args[++i]);
        continue;
      }

      const matchedFlag = FILE_FLAGS.find(flag => arg.startsWith(`${flag}=`));
      if (matchedFlag) {
        files.push(arg.slice(matchedFlag.length + 1));
        continue;
      }

      // First non-flag argument is the subcommand - stop parsing -f as file flags
      if (!arg.startsWith("-")) {
        parsingGlobalFlags = false;
      }
    }

    remainingArgs.push(arg);
  }

  return { files, remainingArgs };
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

  // Add the subcommand and its arguments (e.g., up -d --build, logs -f)
  if (config.subcommandArgs && config.subcommandArgs.length > 0) {
    cmdArgs.push(...config.subcommandArgs);
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
  if (!validateDocker()) {
    return null;
  }

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
    subcommandArgs: ["up"], // Default to 'up' when auto-detecting
  };
}

/**
 * Parse an explicit Docker Compose command from cmdArgs
 *
 * This handles cases where the user runs:
 * - `spotlight run docker compose up -d`
 * - `spotlight run docker-compose logs -f`
 * - `spotlight run docker compose -f custom.yml exec web bash`
 *
 * Returns a DockerComposeConfig if the command is a docker compose command,
 * null otherwise.
 */
export function parseExplicitDockerCompose(cmdArgs: string[]): DockerComposeConfig | null {
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

  // Validate Docker version (required for host.docker.internal on Linux)
  if (!validateDocker()) {
    return null;
  }

  const argsAfterCommand = cmdArgs.slice(argsStartIndex);
  const { files: userFiles, remainingArgs: subcommandArgs } = parseComposeFlags(argsAfterCommand);

  if (subcommandArgs.length === 0) {
    logger.debug("No subcommand provided for docker compose");
    return null;
  }

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
    subcommandArgs,
  };
}
