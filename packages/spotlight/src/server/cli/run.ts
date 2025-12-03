import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import * as path from "node:path";
import * as readline from "node:readline";
import type { SerializedLog } from "@sentry/core";
import { Searcher } from "fast-fuzzy";
import { uuidv7 } from "uuidv7";
import { SENTRY_CONTENT_TYPE } from "../constants.ts";
import { logger } from "../logger.ts";
import type { SentryLogEvent } from "../parser/types.ts";
import { getRegistry } from "../registry/manager.ts";
import type { InstanceMetadata } from "../registry/types.ts";
import { getProcessStartTime } from "../registry/utils.ts";
import type { CLIHandlerOptions } from "../types/cli.ts";
import { buildDockerComposeCommand, detectDockerCompose } from "../utils/docker-compose.ts";
import { getSpotlightURL } from "../utils/extras.ts";
import { EventContainer, getBuffer } from "../utils/index.ts";
import tail, { type OnItemCallback } from "./tail.ts";

const SPOTLIGHT_VERSION = process.env.npm_package_version || "unknown";

// Environment variable host configurations
const LOCALHOST_HOST = "localhost";
const DOCKER_HOST = "host.docker.internal";

/**
 * Detect if there's a package.json with runnable scripts
 */
function detectPackageJson(): { scriptName: string; scriptCommand: string } | null {
  try {
    const scripts = JSON.parse(readFileSync("./package.json", "utf-8")).scripts;
    const scriptName = ["dev", "develop", "serve", "start"].find(name => scripts[name]);
    if (!scriptName || !scripts[scriptName]) {
      return null;
    }
    return { scriptName, scriptCommand: scripts[scriptName] };
  } catch {
    // pass
  }
  return null;
}

/**
 * Prompt the user to choose between Docker Compose and package.json
 */
async function promptUserChoice(): Promise<"docker" | "package"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    console.log("\n⚠️  Both Docker Compose and package.json detected!");
    console.log("\nWhich would you like to use?");
    console.log("  1) docker compose");
    console.log("  2) package.json");

    rl.question("Enter your choice (1 or 2): ", answer => {
      rl.close();
      const choice = answer.trim();
      const selected = choice === "2" ? "package" : "docker";
      logger.info(`Selected: ${selected === "docker" ? "Docker compose" : "package.json"}`);
      resolve(selected);
    });
  });
}

function createLogEnvelope(level: "info" | "error", body: string, timestamp: number): Buffer {
  const envelopeHeader = {
    sdk: {
      name: "sentry.spotlight.stdio",
      version: SPOTLIGHT_VERSION,
    },
  };

  const logItem: SerializedLog = {
    timestamp,
    level,
    body,
    attributes: {},
  };

  const logPayload: SentryLogEvent = {
    type: "log",
    event_id: uuidv7(),
    timestamp,
    items: [
      {
        ...logItem,
        id: uuidv7(),
        severity_number: level === "error" ? 17 : 9, // ERROR=17, INFO=9 per OpenTelemetry spec
        sdk: undefined,
      },
    ],
  };

  const payloadJson = JSON.stringify(logPayload);
  const payloadBuffer = Buffer.from(payloadJson, "utf-8");

  const itemHeader = {
    type: "log",
    length: payloadBuffer.length, // Use byte length, not string length
    item_count: 1,
    content_type: "application/json",
  };

  const parts = [JSON.stringify(envelopeHeader), JSON.stringify(itemHeader), payloadJson];

  return Buffer.from(`${parts.join("\n")}\n`, "utf-8");
}

/**
 * Ping the control center to notify it of this instance
 */
async function pingControlCenter(metadata: InstanceMetadata): Promise<void> {
  try {
    const response = await fetch("http://localhost:8969/api/instances/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
      signal: AbortSignal.timeout(500),
    });
    
    if (response.ok) {
      logger.debug("Successfully pinged control center");
    }
  } catch (err) {
    // Fire-and-forget - don't block if control center isn't running
    logger.debug("Could not ping control center (this is okay if no control center is running)");
  }
}

/**
 * Detect project name from package.json or directory name
 */
function detectProjectName(): string {
  try {
    const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
    if (packageJson.name) {
      return packageJson.name;
    }
  } catch {
    // Fall through to directory name
  }
  
  return path.basename(process.cwd());
}

export default async function run({ port, cmdArgs, basePath, filesToServe, format }: CLIHandlerOptions) {
  let relayStdioAsLogs = true;

  const fuzzySearcher = new Searcher([] as string[], {
    threshold: 0.8,
    ignoreCase: false,
  });

  const logChecker: OnItemCallback = (type, item, envelopeHeader) => {
    if (type !== "log") return true;

    const [, payload] = item;
    const logEvent = payload as SentryLogEvent;

    if (logEvent.items && logEvent.items.length > 0) {
      for (const logItem of logEvent.items) {
        // Check if this is a stdio log from Spotlight itself
        if (envelopeHeader.sdk?.name === "sentry.spotlight.stdio") {
          continue;
        }

        if (!relayStdioAsLogs) continue;

        const logBody = typeof logItem.body === "string" ? logItem.body : String(logItem.body);
        const trimmedBody = logBody.trim();

        if (trimmedBody) {
          const matches = fuzzySearcher.search(trimmedBody);
          if (matches.length > 0) {
            logger.debug("Detected Sentry logging in the process, disabling stdio relay");
            relayStdioAsLogs = false;
            return false;
          }
        }
      }
    }

    return true;
  };

  const serverInstance = await tail({ port, cmdArgs: [], basePath, filesToServe, format }, logChecker);
  if (!serverInstance) {
    logger.error("Failed to start Spotlight sidecar server.");
    logger.error(`The port ${port} might already be in use — most likely by another Spotlight instance.`);
    process.exit(1);
  }

  // We *MUST* have an instance address and a port here
  // as not having that indicates either the server did not start
  // or started in a weird manner (like over a unix socket)
  const actualServerPort = (serverInstance.address() as AddressInfo).port;
  const spotlightUrl = getSpotlightURL(actualServerPort, LOCALHOST_HOST);
  
  // Generate instance ID and prepare metadata (before spawning child process)
  const instanceId = uuidv7();
  const pidStartTime = await getProcessStartTime(process.pid);
  
  let shell = false;
  let stdin: string | undefined = undefined;
  let detectedType = "unknown";
  const env = {
    ...process.env,
    SENTRY_SPOTLIGHT: spotlightUrl,
    // We need the one below for Next.js projects -- they only allow NEXT_PUBLIC_ prefixed env vars
    // on frontend code
    NEXT_PUBLIC_SENTRY_SPOTLIGHT: spotlightUrl,
    // This is not supported in all SDKs but worth adding
    // for the ones that support it
    SENTRY_TRACES_SAMPLE_RATE: "1",
  } as {
    PATH: string;
    SENTRY_SPOTLIGHT: string;
    NEXT_PUBLIC_SENTRY_SPOTLIGHT: string;
    SENTRY_TRACES_SAMPLE_RATE: string;
    [key: string]: string;
  };
  if (cmdArgs.length === 0) {
    const dockerCompose = detectDockerCompose();
    const packageJson = detectPackageJson();

    // If both Docker Compose and package.json are detected, ask the user which one to use
    if (dockerCompose && packageJson) {
      if (!process.stdin.isTTY) {
        logger.error("Both Docker Compose and package.json detected, but cannot prompt in non-interactive mode.");
        logger.error("Please specify a command explicitly or run in an interactive terminal.");
        process.exit(1);
      }
      const choice = await promptUserChoice();

      if (choice === "docker") {
        logger.info(
          `Detected Docker Compose project with ${dockerCompose.serviceNames.length} service(s): ${dockerCompose.serviceNames.join(", ")}`,
        );
        // Use host.docker.internal for backend services to access the host machine
        env.SENTRY_SPOTLIGHT = getSpotlightURL(actualServerPort, DOCKER_HOST);
        const command = buildDockerComposeCommand(dockerCompose);
        cmdArgs = command.cmdArgs;
        stdin = command.stdin;
        detectedType = "docker-compose";
        // Always unset COMPOSE_FILE to avoid conflicts with explicit -f flags
        delete env.COMPOSE_FILE;
      } else {
        logger.info(`Using package.json script: ${packageJson.scriptName}`);
        cmdArgs = [packageJson.scriptCommand];
        shell = true;
        detectedType = "package.json";
        env.PATH = path.resolve("./node_modules/.bin") + path.delimiter + env.PATH;
      }
    } else if (dockerCompose) {
      logger.info(
        `Detected Docker Compose project with ${dockerCompose.serviceNames.length} service(s): ${dockerCompose.serviceNames.join(", ")}`,
      );
      // Use host.docker.internal for backend services to access the host machine
      env.SENTRY_SPOTLIGHT = getSpotlightURL(actualServerPort, DOCKER_HOST);

      const command = buildDockerComposeCommand(dockerCompose);
      cmdArgs = command.cmdArgs;
      stdin = command.stdin;
      detectedType = "docker-compose";
      // Always unset COMPOSE_FILE to avoid conflicts with explicit -f flags
      delete env.COMPOSE_FILE;
    } else if (packageJson) {
      logger.info(`Using package.json script: ${packageJson.scriptName}`);
      cmdArgs = [packageJson.scriptCommand];
      shell = true;
      detectedType = "package.json";
      env.PATH = path.resolve("./node_modules/.bin") + path.delimiter + env.PATH;
    }
  }
  if (cmdArgs.length === 0) {
    logger.error("Error: No command specified to run and could not infer the command automatically.");
    process.exit(1);
  }
  const cmdStr = cmdArgs.join(" ");
  logger.info(`Starting command: ${cmdStr}`);
  
  // When we have Docker Compose override YAML (for -f -), we need to pipe stdin
  // Otherwise, inherit stdin to relay user input to the downstream process
  const stdinMode: "pipe" | "inherit" = stdin ? "pipe" : "inherit";
  const runCmd = spawn(cmdArgs[0], cmdArgs.slice(1), {
    cwd: process.cwd(),
    env,
    shell,
    windowsVerbatimArguments: true,
    windowsHide: true,
    stdio: [stdinMode, "pipe", "pipe"],
  });

  const { stdout, stderr } = runCmd;
  if (!stdout || !stderr) {
    logger.error("Failed to create process streams");
    process.exit(1);
  }

  // If our command has a stdin input _and_ we can send to stdin, write and close
  if (stdin) {
    if (!runCmd.stdin) {
      logger.error("Failed to pipe Docker Compose override: stdin is not available");
      process.exit(1);
    }
    runCmd.stdin.write(stdin);
    runCmd.stdin.end();
  }

  const processLogLine = (line: string, level: "info" | "error") => {
    if (!relayStdioAsLogs) return;
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    fuzzySearcher.add(trimmedLine);

    const timestamp = Date.now() / 1000;
    const envelopeBuffer = createLogEnvelope(level, trimmedLine, timestamp);

    const container = new EventContainer(SENTRY_CONTENT_TYPE, envelopeBuffer);
    // Add to buffer - this will automatically trigger all subscribers
    // including the onEnvelope callback registered in tail()
    getBuffer().put(container);
  };

  let stdoutBuffer = "";
  let stderrBuffer = "";

  // Stream stdout as info-level logs
  stdout.on("data", (data: Buffer) => {
    stdoutBuffer += data.toString();
    const lines = stdoutBuffer.split("\n");
    // Keep the last partial line in the buffer
    stdoutBuffer = lines.pop() || "";

    for (const line of lines) {
      processLogLine(line, "info");
    }
  });

  // Stream stderr as error-level logs
  stderr.on("data", (data: Buffer) => {
    stderrBuffer += data.toString();
    const lines = stderrBuffer.split("\n");
    // Keep the last partial line in the buffer
    stderrBuffer = lines.pop() || "";

    for (const line of lines) {
      processLogLine(line, "error");
    }
  });

  runCmd.on("error", err => {
    logger.error(`Failed to run ${cmdStr}:`);
    logger.error(err);
    process.exit(1);
  });

  runCmd.on("close", code => {
    // Handle any remaining buffered lines
    if (stdoutBuffer.trim()) {
      processLogLine(stdoutBuffer, "info");
    }
    if (stderrBuffer.trim()) {
      processLogLine(stderrBuffer, "error");
    }

    if (!code) {
      logger.error(`${cmdStr} exited, terminating.`);
    } else {
      logger.error(`${cmdStr} exited with code ${code}.`);
    }
    process.exit(code);
  });
  const killRunCmd = () => {
    if (runCmd.killed) return;
    stdout.destroy();
    stderr.destroy();
    runCmd.kill();
  };
  runCmd.on("spawn", async () => {
    runCmd.removeAllListeners("spawn");
    runCmd.removeAllListeners("error");
    
    // Register instance after child process has spawned
    try {
      const childPidStartTime = await getProcessStartTime(runCmd.pid);
      const projectName = detectProjectName();
      
      const metadata: InstanceMetadata = {
        instanceId,
        port: actualServerPort,
        pid: process.pid,
        pidStartTime,
        childPid: runCmd.pid || null,
        childPidStartTime: runCmd.pid ? childPidStartTime : null,
        command: cmdStr,
        cmdArgs,
        cwd: process.cwd(),
        startTime: new Date().toISOString(),
        projectName,
        detectedType,
      };
      
      // Register in local registry
      await getRegistry().register(metadata);
      
      // Ping control center (fire-and-forget)
      pingControlCenter(metadata);
      
      // Register cleanup to remove metadata on exit
      const cleanup = async () => {
        await getRegistry().unregister(instanceId);
      };
      
      process.on("exit", () => {
        // Use sync operation here since we can't await in exit handler
        getRegistry().unregister(instanceId).catch(() => {});
      });
      process.on("SIGINT", async () => {
        await cleanup();
        killRunCmd();
      });
      process.on("SIGTERM", async () => {
        await cleanup();
        killRunCmd();
      });
    } catch (err) {
      logger.error(`Failed to register instance: ${err}`);
      // Don't fail the whole process if registration fails
    }
    
    process.on("SIGINT", killRunCmd);
    process.on("SIGTERM", killRunCmd);
    process.on("beforeExit", killRunCmd);
  });
}
