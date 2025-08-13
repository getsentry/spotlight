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
const port = positionals.length > 0 ? Number(positionals[0]) : Number(values.port);

setupSidecar({
  port: Number.isNaN(port) ? undefined : port,
  debug: values.debug,
  isStandalone: true,
});
