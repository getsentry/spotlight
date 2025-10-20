#!/usr/bin/env node
import { captureException } from "@sentry/core";
import { EventSource } from "eventsource";
import { SENTRY_CONTENT_TYPE } from "./src/constants.js";
import { formatEnvelope } from "./src/format";
import { parseCLIArgs, setupSidecar } from "./src/main.js";
import type { ParsedEnvelope } from "./src/parser/processEnvelope.js";

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
const args = parseCLIArgs();
let stdioMCP = false;

if (args.help) {
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

const cmd = args._positionals[0];
switch (cmd) {
  case "help":
    printHelp();
    runServer = false;
    break;
  case "mcp":
    stdioMCP = true;
    break;
  case "run":
    // do crazy stuff
    break;
  case "tail": {
    const eventTypes =
      args._positionals.length > 1 ? args._positionals.slice(1).map(arg => arg.toLowerCase()) : ["everything"];
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
      const client = await connectUpstream(args.port);
      runServer = false;
      client.addEventListener(SENTRY_CONTENT_TYPE, event => onEnvelope!(JSON.parse(event.data)));
    } catch (err) {
      // if we fail, fine then we'll start our own
      if (err instanceof Error && !err.message?.includes(args.port.toString())) {
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
    ...args,
    stdioMCP,
    onEnvelope,
    isStandalone: true,
  });
}
