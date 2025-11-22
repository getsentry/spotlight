import { EVERYTHING_MAGIC_WORDS, NAME_TO_TYPE_MAPPING } from "../cli/tail.ts";
import { AVAILABLE_FORMATTERS } from "../formatters/types.ts";

export default function showHelp() {
  console.log(`
Spotlight Sidecar - Development proxy server for Spotlight

Usage: spotlight [command] [options]

Commands:
  server               Start Spotlight sidecar server (default)
  run [command...]     Run a command with Spotlight enabled
  list                 List all running Spotlight instances
                       Use --all to include unresponsive/orphaned instances
  tail [types...]      Tail Sentry events (default: everything)
                       Available types: ${[...Object.keys(NAME_TO_TYPE_MAPPING)].join(", ")}
                       Magic words: ${[...EVERYTHING_MAGIC_WORDS].join(", ")}
  mcp                  Start in MCP (Model Context Protocol) mode
  help                 Show this help message

Options:
  -p, --port <port>      Port to listen on (default: 8969, or 0 for random)
  -d, --debug            Enable debug logging
  -f, --format <format>  Output format for commands like run, tail, and list command (default: human)
                         Available formats: ${[...AVAILABLE_FORMATTERS].join(", ")}
  -h, --help             Show this help message

Examples:
  spotlight                          # Start on default port 8969
  spotlight run npm run dev          # Run npm dev with Spotlight
  spotlight list                     # List all running instances
  spotlight list --format json       # List instances in JSON format
  spotlight tail                     # Tail all event types (human format)
  spotlight tail errors              # Tail only errors
  spotlight tail errors logs         # Tail errors and logs
  spotlight tail --format json       # Explicitly use json format
  spotlight mcp                      # Start in MCP mode
  spotlight --port 3000              # Start on port 3000
  spotlight -p 3000 -d               # Start on port 3000 with debug logging
`);
  process.exit(0);
}
