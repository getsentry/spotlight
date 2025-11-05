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
import { EventContainer, getBuffer } from "../utils/index.js";
import tail, { type OnItemCallback } from "./tail.js";

const SPOTLIGHT_VERSION = process.env.npm_package_version || "unknown";

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
    logger.error(`The port ${port} might already be in use by another process.`);
    process.exit(1);
  }

  // We *MUST* have an instance address and a port here
  // as not having that indicates either the server did not start
  // or started in a weird manner (like over a unix socket)
  const actualServerPort = (serverInstance.address() as AddressInfo).port;
  const spotlightUrl = getSpotlightURL(actualServerPort);
  let shell = false;
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
    // We `inherit` the stdin so we relay any user input to the downstream process
    // This also helps sending the SIGINT signal directly. Alternative would be to
    // use "pipe" and call `runCmd.stdin.end()` to signal the end of the input stream.
    // Never ever use `ignore` as it keeps stdin open forever, preventing a graceful shutdown
    stdio: ["inherit", "pipe", "pipe"],
  });

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
  runCmd.stdout.on("data", (data: Buffer) => {
    stdoutBuffer += data.toString();
    const lines = stdoutBuffer.split("\n");
    // Keep the last partial line in the buffer
    stdoutBuffer = lines.pop() || "";

    for (const line of lines) {
      processLogLine(line, "info");
    }
  });

  // Stream stderr as error-level logs
  runCmd.stderr.on("data", (data: Buffer) => {
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
    runCmd.stdout.destroy();
    runCmd.stderr.destroy();
    runCmd.kill();
  };
  runCmd.on("spawn", () => {
    runCmd.removeAllListeners("spawn");
    runCmd.removeAllListeners("error");
    process.on("SIGINT", killRunCmd);
    process.on("SIGTERM", killRunCmd);
    process.on("beforeExit", killRunCmd);
  });
}
