#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { captureException } from "@sentry/core";
import { EventSource } from "eventsource";
import { SENTRY_CONTENT_TYPE } from "./constants.js";
import { formatEnvelope } from "./format/index.js";
import { parseCLIArgs, setupSidecar } from "./main.js";
import type { ParsedEnvelope } from "./parser/processEnvelope.js";

const connectUpstream = async (port: number) =>
  new Promise<EventSource>((resolve, reject) => {
    const client = new EventSource(`http://localhost:${port}/stream`);
    client.onerror = reject;
    client.onopen = () => resolve(client);
  });

const SEPARATOR = Array(10).fill("─").join("");

function displayEnvelope(envelope: ParsedEnvelope["envelope"]) {
  console.log(`${envelope[0].event_id} | ${envelope[1][0][0].type} | ${envelope[0].sdk?.name}\n\n`);
  const lines = formatEnvelope(envelope);
  if (lines.length > 0) {
    console.log(lines.join("\n"));
  } else {
    console.log("No parser for the given event type");
  }
  console.log("\n");
  console.log(SEPARATOR);
}

const printHelp = () => {
  console.log(`
Spotlight Sidecar - Development proxy server for Spotlight

Usage: spotlight-sidecar [command] [options]

Commands:
  tail [types...]      Tail Sentry events (default: everything)
                       Available types: ${[...Object.keys(NAME_TO_TYPE_MAPPING)].join(", ")}
                       Magic words: ${[...EVERYTHING_MAGIC_WORDS].join(", ")}
  mcp                  Start in MCP (Model Context Protocol) mode
  help                 Show this help message

Options:
  -p, --port <port>    Port to listen on (default: 8969)
  -d, --debug          Enable debug logging
  -h, --help           Show this help message

Examples:
  spotlight-sidecar                    # Start on default port 8969
  spotlight-sidecar tail               # Tail all event types
  spotlight-sidecar tail errors        # Tail only errors
  spotlight-sidecar tail errors logs   # Tail errors and logs
  spotlight-sidecar mcp                # Start in MCP mode
  spotlight-sidecar --port 3000        # Start on port 3000
  spotlight-sidecar -p 3000 -d         # Start on port 3000 with debug logging
`);
  process.exit(0);
};

let runServer = true;
let { cmd, cmdArgs, help, port, debug } = parseCLIArgs();
let stdioMCP = false;

if (help) {
  runServer = false;
  printHelp();
}

let onEnvelope: ((envelope: ParsedEnvelope["envelope"]) => void) | undefined = undefined;
const NAME_TO_TYPE_MAPPING: Record<string, string[]> = Object.freeze({
  traces: ["transaction", "span"],
  profiles: ["profile"],
  logs: ["log"],
  attachments: ["attachment"],
  errors: ["event"],
  sessions: ["session"],
  replays: ["replay_video"],
  // client_report
});
const EVERYTHING_MAGIC_WORDS = new Set(["everything", "all", "*"]);
export const SUPPORTED_ARGS = new Set([...Object.keys(NAME_TO_TYPE_MAPPING), ...EVERYTHING_MAGIC_WORDS]);

switch (cmd) {
  case "help":
    printHelp();
    runServer = false;
    break;
  case "mcp":
    stdioMCP = true;
    break;
  // @ts-expect-error ts7029 -- fallthrough is intentional
  case "run": {
    let shell = false;
    if (cmdArgs.length === 0) {
      // try package.json to find default dev command
      try {
        const scripts = JSON.parse(readFileSync("package.json", "utf-8")).scripts;
        cmdArgs = [scripts.dev ?? scripts.develop ?? scripts.serve ?? scripts.start];
        shell = true;
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
    const cmdStr = cmdArgs.join(" ");
    const runCmd = spawn(cmdArgs[0], cmdArgs.slice(1), {
      cwd: process.cwd(),
      shell,
      windowsVerbatimArguments: true,
      windowsHide: true,
      // TODO: Consider using pipe and forwarding output as logs to Spotlight
      stdio: "ignore",
      env: {
        ...process.env,
        SENTRY_SPOTLIGHT: `http://localhost:${port}/stream`,
        // This is not supported in all SDKs but worth adding
        // for the ones that support it
        SENTRY_TRACES_SAMPLE_RATE: "1",
        //  Consider setting SENTRY_DSN to our hack server too?
      },
    });
    runCmd.on("error", err => {
      console.error(`Failed to run ${cmdStr}:`, err);
      process.exit(1);
    });
    runCmd.on("close", code => {
      if (!code) {
        console.error(`${cmdStr} exited, terminating.`);
      } else {
        console.error(`${cmdStr} exited with code ${code}.`);
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

    cmd = "tail";
    cmdArgs = [];
    // biome-ignore lint/suspicious/noFallthroughSwitchClause:
    // Intentional fallthrough to start the event streaming after running the command
  }
  case "tail": {
    const eventTypes = cmdArgs.length > 0 ? cmdArgs.map(arg => arg.toLowerCase()) : ["everything"];
    for (const eventType of eventTypes) {
      if (!SUPPORTED_ARGS.has(eventType)) {
        console.error(`Error: Unsupported argument "${eventType}".`);
        console.error(`Supported arguments are: ${[...SUPPORTED_ARGS].join(", ")}`);
        process.exit(1);
      }
    }

    if (eventTypes.some(type => EVERYTHING_MAGIC_WORDS.has(type))) {
      onEnvelope = displayEnvelope;
    } else {
      const types = new Set([...eventTypes.flatMap(type => NAME_TO_TYPE_MAPPING[type] || [])]);
      onEnvelope = envelope => {
        for (const [header] of envelope[1]) {
          if (header.type && types.has(header.type)) {
            displayEnvelope(envelope);
          }
        }
      };
    }

    // try to connect to an already existing server first
    try {
      const client = await connectUpstream(port);
      runServer = false;
      client.addEventListener(SENTRY_CONTENT_TYPE, event => onEnvelope!(JSON.parse(event.data)));
    } catch (err) {
      // if we fail, fine then we'll start our own
      if (err instanceof Error && !err.message?.includes(port.toString())) {
        captureException(err);
        console.error("Error when trying to connect to upstream sidecar:", err);
        process.exit(1);
      }
    }
    break;
  }
  case undefined:
  case "":
    break;
  default:
    break;
}

if (runServer) {
  await setupSidecar({
    port,
    debug,
    stdioMCP,
    onEnvelope,
    isStandalone: true,
  });
}
