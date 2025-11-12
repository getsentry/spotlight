#!/usr/bin/env node
import { parseArgs } from "node:util";
import showHelp from "./cli/help.ts";
import mcp from "./cli/mcp.ts";
import run from "./cli/run.ts";
import server from "./cli/server.ts";
import tail from "./cli/tail.ts";
import { DEFAULT_PORT } from "./constants.ts";
import { AVAILABLE_FORMATTERS } from "./formatters/types.ts";
import type { FormatterType } from "./formatters/types.ts";
import { enableDebugLogging, logger } from "./logger.ts";
import type { CLIHandler, CLIHandlerOptions } from "./types/cli.ts";

// When port is set to `0` for a server to listen on,
// it tells the OS to find a random available port.
// This can then be retrieved after the server starts.
const MAGIC_PORT_FOR_DYNAMIC_ASSIGNMENT = 0;
const PARSE_ARGS_CONFIG = {
  options: {
    port: {
      type: "string",
      short: "p",
      default: undefined,
    },
    debug: {
      type: "boolean",
      short: "d",
      default: false,
    },
    format: {
      type: "string",
      short: "f",
      default: "human",
    },
    // Deprecated -- use the positional `mcp` argument instead
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
  strict: true,
} as const;

export type CLIArgs = {
  port: number;
  debug: boolean;
  help: boolean;
  format: FormatterType;
  cmd: string | undefined;
  cmdArgs: string[];
};

export function parseCLIArgs(): CLIArgs {
  const args = Array.from(process.argv).slice(2);
  const preParse = parseArgs({
    ...PARSE_ARGS_CONFIG,
    strict: false,
    tokens: true,
  });
  let cmdArgs: string[] | undefined = undefined;
  const runToken = preParse.tokens.find(token => token.kind === "positional" && token.value === "run");
  if (runToken) {
    const cutOff = preParse.tokens.find(token => token.index > runToken.index && token.kind === "positional");
    cmdArgs = cutOff ? args.splice(cutOff.index) : [];
  }
  const { values, positionals } = parseArgs({
    args,
    ...PARSE_ARGS_CONFIG,
  });

  // Handle legacy positional argument for port (backwards compatibility)
  const portInput = positionals.length === 1 && /^\d{1,5}$/.test(positionals[0]) ? positionals.shift() : values.port;

  const port = portInput != null ? Number(portInput) : runToken ? MAGIC_PORT_FOR_DYNAMIC_ASSIGNMENT : DEFAULT_PORT;
  if (Number.isNaN(port)) {
    // Validate port number
    console.error(`Error: Invalid port number '${portInput}'`);
    console.error("Port must be a valid number between 1 and 65535");
    process.exit(1);
  }

  if (port < 0 || port > 65535) {
    console.error(`Error: Port ${port} is out of valid range (1-65535 or 0 for automatic assignment)`);
    process.exit(1);
  }

  if (values["stdio-mcp"]) {
    positionals.unshift("mcp");
    console.warn("Warning: --stdio-mcp is deprecated. Please use the positional argument 'mcp' instead.");
  }

  const format = values.format as string;
  if (!AVAILABLE_FORMATTERS.includes(format as FormatterType)) {
    console.error(`Error: Invalid format '${format}'`);
    console.error(`Valid formats are: ${AVAILABLE_FORMATTERS.join(", ")}`);
    process.exit(1);
  }

  const result: CLIArgs = {
    debug: values.debug as boolean,
    help: values.help as boolean,
    format: format as FormatterType,
    port,
    cmd: positionals[0],
    cmdArgs: cmdArgs ?? positionals.slice(1),
  };

  return result;
}
export const CLI_CMD_MAP = new Map<string | undefined, CLIHandler>([
  ["help", showHelp],
  ["mcp", mcp],
  ["tail", tail],
  ["run", run],
  ["server", server],
  [undefined, server],
]);

export async function main({
  basePath,
  filesToServe,
}: { basePath?: CLIHandlerOptions["basePath"]; filesToServe?: CLIHandlerOptions["filesToServe"] } = {}) {
  let { cmd, cmdArgs, help, port, debug, format } = parseCLIArgs();
  if (debug || process.env.SPOTLIGHT_DEBUG) {
    enableDebugLogging(true);
  }
  const spotlightVersion = process.env.npm_package_version || "{unknown}";
  logger.info(`Spotlight by Sentry - v${spotlightVersion}`);

  if (help) {
    cmd = "help";
    cmdArgs = [];
  }

  const handler = CLI_CMD_MAP.get(cmd) || showHelp;

  return await handler({ cmd, cmdArgs, port, help, debug, format, basePath, filesToServe });
}
