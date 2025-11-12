import { EVERYTHING_MAGIC_WORDS, NAME_TO_TYPE_MAPPING } from "../cli/tail.js";
import { AVAILABLE_FORMATTERS } from "../formatters/types.js";

export default function showHelp() {
  console.log(`
Spotlight Sidecar - Development proxy server for Spotlight

Usage: spotlight [command] [options]

Commands:
  tail [types...]      Tail Sentry events (default: everything)
                       Available types: ${[...Object.keys(NAME_TO_TYPE_MAPPING)].join(", ")}
                       Magic words: ${[...EVERYTHING_MAGIC_WORDS].join(", ")}
  mcp                  Start in MCP (Model Context Protocol) mode
  help                 Show this help message

Options:
  -p, --port <port>      Port to listen on (default: 8969, or 0 for random)
  -d, --debug            Enable debug logging
  -f, --format <format>  Output format for tail command (default: human)
                         Available formats: ${[...AVAILABLE_FORMATTERS].join(", ")}
  -h, --help             Show this help message

Examples:
  spotlight                          # Start on default port 8969
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
