import { EVERYTHING_MAGIC_WORDS, NAME_TO_TYPE_MAPPING } from "../cli/tail.ts";
import { AVAILABLE_FORMATTERS } from "../formatters/types.ts";

export default function showHelp() {
  console.log(`
Spotlight Sidecar - Development proxy server for Spotlight

Usage: spotlight [command] [options]

Commands:
  server               Start the Spotlight sidecar server (default)
  run [command...]     Run a command with Spotlight automatically configured
  tail [types...]      Tail Sentry events (default: everything)
                       Available types: ${[...Object.keys(NAME_TO_TYPE_MAPPING)].join(", ")}
                       Magic words: ${[...EVERYTHING_MAGIC_WORDS].join(", ")}
  mcp                  Start in MCP (Model Context Protocol) mode
  help                 Show this help message

Options:
  -p, --port <port>      Port to listen on (default: 8969, or 0 for random)
  -o, --open             Open the Spotlight dashboard in your default browser
  -d, --debug            Enable debug logging
  -f, --format <format>  Output format for tail command (default: human)
                         Available formats: ${[...AVAILABLE_FORMATTERS].join(", ")}
  -A, --allowed-origin <origin>
                         Additional origins to allow for CORS requests.
                         Can be specified multiple times or comma-separated.
                         Accepts full origins (https://example.com:443) for
                         strict matching or plain domains (myapp.local) to
                         allow any protocol/port.
  -h, --help             Show this help message

Examples:
  spotlight                          # Start on default port 8969
  spotlight --open                   # Start and open dashboard in browser
  spotlight run npm start            # Run npm start with Spotlight configured
  spotlight run --open npm start     # Run and open dashboard in browser
  spotlight tail                     # Tail all event types (human format)
  spotlight tail --open              # Tail events and open dashboard in browser
  spotlight tail errors              # Tail only errors
  spotlight tail errors logs         # Tail errors and logs
  spotlight tail --format json       # Explicitly use json format
  spotlight mcp                      # Start in MCP mode
  spotlight --port 3000              # Start on port 3000
  spotlight -p 3000 -d               # Start on port 3000 with debug logging
  spotlight -A myapp.local           # Allow requests from myapp.local
  spotlight -A https://tunnel.ngrok.io -A dev.local  # Multiple origins
`);
  process.exit(0);
}
