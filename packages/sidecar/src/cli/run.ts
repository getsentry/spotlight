import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import * as path from "node:path";
import type { SerializedLog } from "@sentry/core";
import { Searcher } from "fast-fuzzy";
import { uuidv7 } from "uuidv7";
import { SENTRY_CONTENT_TYPE } from "../constants.js";
import { logger } from "../logger.js";
import type { SentryLogEvent } from "../parser/types.js";
import type { CLIHandlerOptions } from "../types/cli.js";
import { getSpotlightURL } from "../utils/extras.js";
import tail, { type OnItemCallback } from "./tail.js";

const STDIO_LOG_MARKER = "__spotlight_stdio_log";

/**
 * Creates a Sentry log envelope from a log message
 * Marks the log with STDIO_LOG_MARKER to exclude from duplicate detection
 */
function createLogEnvelope(level: "info" | "error", body: string, timestamp: number): Buffer {
  const envelopeHeader = {};

  // Create log item with special marker attribute
  const logItem: SerializedLog = {
    timestamp,
    level,
    body,
    attributes: {
      [STDIO_LOG_MARKER]: {
        value: true,
        type: "boolean",
      },
    },
  };

  // Create log event payload
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

  // Create item header
  const itemHeader = {
    type: "log",
    length: payloadBuffer.length, // Use byte length, not string length
    item_count: 1,
    content_type: "application/json",
  };

  // Build envelope (newline-delimited JSON)
  const parts = [JSON.stringify(envelopeHeader), JSON.stringify(itemHeader), payloadJson];

  return Buffer.from(`${parts.join("\n")}\n`, "utf-8");
}

/**
 * Sends an envelope to the sidecar server via HTTP POST
 */
async function sendEnvelopeToSidecar(envelopeBuffer: Buffer, sidecarPort: number): Promise<void> {
  try {
    const response = await fetch(`http://localhost:${sidecarPort}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": SENTRY_CONTENT_TYPE,
      },
      body: envelopeBuffer,
    });

    if (!response.ok) {
      logger.debug(`Failed to send stdio log to sidecar: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.debug(`Error sending stdio log to sidecar: ${error}`);
  }
}

export default async function run({ port, cmdArgs, basePath, filesToServe, format }: CLIHandlerOptions) {
  let relayStdioAsLogs = true;
  
  // Initialize fuzzy searcher for stdout/stderr log lines
  const fuzzySearcher = new Searcher([] as string[], {
    threshold: 0.8,
    ignoreCase: false,
  });
  
  const logChecker: OnItemCallback = (type, item) => {
    if (type !== "log") return true;

    // Extract log body from the item
    const [, payload] = item;
    const logEvent = payload as SentryLogEvent;

    if (logEvent.items && logEvent.items.length > 0) {
      for (const logItem of logEvent.items) {
        // Skip logs that we created from stdio (they have the marker)
        if (logItem.attributes?.[STDIO_LOG_MARKER]) {
          continue;
        }

        // Only check for duplicates if we're still relaying stdio
        if (!relayStdioAsLogs) continue;

        const logBody = typeof logItem.body === "string" ? logItem.body : String(logItem.body);
        const trimmedBody = logBody.trim();

        if (trimmedBody) {
          // Search for fuzzy matches in stdout/stderr lines
          const matches = fuzzySearcher.search(trimmedBody);
          // If we find a match with >80% similarity, we detected Sentry logging
          if (matches.length > 0) {
            logger.debug("Detected Sentry logging in the process, disabling stdio relay");
            relayStdioAsLogs = false;
            // Return false to skip this log (prevent duplicate)
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
    process.exit(1);
  }

  // We *MUST* have an instance address and a port here
  // as not having that indicates either the server did not start
  // or started in a weird manner (like over a unix socket)
  const actualServerPort = (serverInstance.address() as AddressInfo).port;
  let shell = false;
  const env = {
    ...process.env,
    SENTRY_SPOTLIGHT: getSpotlightURL(actualServerPort),
    // This is not supported in all SDKs but worth adding
    // for the ones that support it
    SENTRY_TRACES_SAMPLE_RATE: "1",
    //  Consider setting SENTRY_DSN to our hack server too?
  } as { PATH: string; SENTRY_SPOTLIGHT: string; SENTRY_TRACES_SAMPLE_RATE: string; [key: string]: string };
  if (cmdArgs.length === 0) {
    // try package.json to find default dev command
    try {
      const scripts = JSON.parse(readFileSync("./package.json", "utf-8")).scripts;
      cmdArgs = [scripts.dev ?? scripts.develop ?? scripts.serve ?? scripts.start];
      shell = true;
      env.PATH = path.resolve("./node_modules/.bin") + path.delimiter + env.PATH;
    } catch {
      // pass
    }
  }
  if (cmdArgs.length === 0) {
    // try to see if this is a docker-compose project
    try {
      // TODO: Check docker-compose.yml existence
      // TODO: Check docker-compose.yaml existence
      // TODO: Check `docker compose --version` existence
      // TODO: Check `docker-compose --version` existence
    } catch {
      // pass
    }
  }
  if (cmdArgs.length === 0) {
    logger.error("Error: No command specified to run and could not infer the command automatically.");
    process.exit(1);
  }
  const cmdStr = cmdArgs.join(" ");
  logger.info(`Starting command: ${cmdStr}`);
  const runCmd = spawn(cmdArgs[0], cmdArgs.slice(1), {
    cwd: process.cwd(),
    env,
    shell,
    windowsVerbatimArguments: true,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Helper function to process and send log lines
  const processLogLine = (line: string, level: "info" | "error") => {
    if (!relayStdioAsLogs) return;
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    fuzzySearcher.add(trimmedLine);

    const timestamp = Date.now() / 1000; // Sentry uses seconds
    const envelopeBuffer = createLogEnvelope(level, trimmedLine, timestamp);
    // Send to sidecar via HTTP (don't await to avoid blocking)
    sendEnvelopeToSidecar(envelopeBuffer, actualServerPort).catch(err => {
      logger.debug(`Failed to send stdio log: ${err}`);
    });
  };

  // Buffer for partial lines
  let stdoutBuffer = "";
  let stderrBuffer = "";

  // Stream stdout as info-level logs
  runCmd.stdout?.on("data", (data: Buffer) => {
    stdoutBuffer += data.toString();
    const lines = stdoutBuffer.split("\n");
    // Keep the last partial line in the buffer
    stdoutBuffer = lines.pop() || "";

    for (const line of lines) {
      processLogLine(line, "info");
    }
  });

  // Stream stderr as error-level logs
  runCmd.stderr?.on("data", (data: Buffer) => {
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
    runCmd.removeAllListeners();
    runCmd.kill();
  };
  runCmd.on("spawn", () => {
    runCmd.removeAllListeners("error");
    process.on("SIGINT", killRunCmd);
    process.on("SIGTERM", killRunCmd);
    process.on("beforeExit", killRunCmd);
  });
}
