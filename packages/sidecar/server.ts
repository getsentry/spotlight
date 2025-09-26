#!/usr/bin/env node
import { parseCLIArgs, setupSidecar } from "./src/main.js";
import type { ParsedEnvelope } from "./src/parser/processEnvelope.js";

const args = parseCLIArgs();

if (args.help) {
  console.log(`
Spotlight Sidecar - Development proxy server for Spotlight

Usage: spotlight-sidecar [options]

Options:
  -p, --port <port>    Port to listen on (default: 8969)
  --stdio-mcp          Enable MCP stdio transport
  -d, --debug          Enable debug logging
  -h, --help           Show this help message

Examples:
  spotlight-sidecar                    # Start on default port 8969
  spotlight-sidecar --port 3000        # Start on port 3000
  spotlight-sidecar -p 3000 -d         # Start on port 3000 with debug logging
`);
  process.exit(0);
}

let onEnvelope: ((envelope: ParsedEnvelope["event"]) => void) | undefined = undefined;
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

if (args._positionals.length > 1) {
  console.error("Error: Too many positional arguments provided.");
  process.exit(1);
}

if (args._positionals.length === 1) {
  const eventTypes = args._positionals[0].toLowerCase().split(/\s*[,+]\s*/gi);
  for (const eventType of eventTypes) {
    if (!SUPPORTED_ARGS.has(eventType)) {
      console.error(`Error: Unsupported argument "${eventType}".`);
      console.error(`Supported arguments are: ${[...SUPPORTED_ARGS].join(", ")}`);
      process.exit(1);
    }
  }

  if (eventTypes.some(type => EVERYTHING_MAGIC_WORDS.has(type))) {
    onEnvelope = (envelope: ParsedEnvelope["event"]) => {
      console.log(
        JSON.stringify(
          envelope[1].map(([h]) => h.type),
          null,
          0,
        ),
      );
    };
  } else {
    const types = new Set([...eventTypes.flatMap(type => NAME_TO_TYPE_MAPPING[type] || [])]);
    onEnvelope = (envelope: ParsedEnvelope["event"]) => {
      for (const [header] of envelope[1]) {
        if (header.type && types.has(header.type)) {
          console.log(JSON.stringify(envelope, null, 0));
        }
      }
    };
  }
} 

await setupSidecar({
  ...args,
  onEnvelope,
  isStandalone: true,
});
