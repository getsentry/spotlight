#!/usr/bin/env node
import { parseCLIArgs, setupSidecar } from "./src/main.js";

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

await setupSidecar({
  ...args,
  isStandalone: true,
});
