#!/usr/bin/env node
import { parseArgs } from "node:util";
import { setupSidecar } from "./src/main.js";

const { values, positionals } = parseArgs({
  options: {
    port: {
      type: "string",
      short: "p",
      default: "8969",
    },
    debug: {
      type: "boolean",
      short: "d",
      default: false,
    },
    "stdio-mcp": {
      type: "boolean",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
  },
  allowPositionals: true,
});

if (values.help) {
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

// Handle legacy positional argument for port (backwards compatibility)
const portInput = positionals.length > 0 ? positionals[0] : values.port;
const port = Number(portInput);

// Validate port number
if (Number.isNaN(port)) {
  console.error(`Error: Invalid port number '${portInput}'`);
  console.error("Port must be a valid number between 1 and 65535");
  process.exit(1);
}

if (port < 1 || port > 65535) {
  console.error(`Error: Port ${port} is out of valid range (1-65535)`);
  process.exit(1);
}

setupSidecar({
  port,
  debug: values.debug,
  isStandalone: true,
  stdioMCP: values["stdio-mcp"],
});
