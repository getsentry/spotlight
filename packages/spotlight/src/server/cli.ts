#!/usr/bin/env node
import { parseArgs } from "node:util";
import { metrics } from "@sentry/node";
import showHelp from "./cli/help.ts";
import mcp from "./cli/mcp.ts";
import run from "./cli/run.ts";
import server from "./cli/server.ts";
import tail from "./cli/tail.ts";
import { DEFAULT_PORT } from "./constants.ts";
import { AVAILABLE_FORMATTERS } from "./formatters/types.ts";
import type { FormatterType } from "./formatters/types.ts";
import { enableDebugLogging, logger } from "./logger.ts";
import type { CLIHandlerOptions, Command } from "./types/cli.ts";

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
    "allowed-origin": {
      type: "string",
      short: "A",
      multiple: true,
      default: [] as string[],
    },
    // Deprecated -- use the positional `mcp` argument instead
    "stdio-mcp": {
      type: "boolean",
      default: false,
    },
    open: {
      type: "boolean",
      short: "o",
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
  open: boolean;
  format: FormatterType;
  cmd: string | undefined;
  cmdArgs: string[];
  allowedOrigins: string[];
};

export function parseCLIArgs(): CLIArgs {
  const args = Array.from(process.argv).slice(2);
  const preParse = parseArgs({
    ...PARSE_ARGS_CONFIG,
    strict: false,
    tokens: true,
  });
  let cmdArgs: string[] | undefined = undefined;
  // Only apply special handling for "run" if it's the actual command (first positional),
  // not when it appears as an argument to another command like "spotlight help run"
  const firstPositional = preParse.tokens.find(token => token.kind === "positional");
  const isRunCommand = firstPositional?.value === "run";
  if (isRunCommand && firstPositional) {
    const cutOff = preParse.tokens.find(token => token.index > firstPositional.index && token.kind === "positional");
    cmdArgs = cutOff ? args.splice(cutOff.index) : [];
  }
  const { values, positionals } = parseArgs({
    args,
    ...PARSE_ARGS_CONFIG,
  });

  // Handle legacy positional argument for port (backwards compatibility)
  const portInput = positionals.length === 1 && /^\d{1,5}$/.test(positionals[0]) ? positionals.shift() : values.port;

  const port = portInput != null ? Number(portInput) : isRunCommand ? MAGIC_PORT_FOR_DYNAMIC_ASSIGNMENT : DEFAULT_PORT;
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

  // Parse allowed origins - supports both repeatable flags and comma-separated values
  const allowedOriginInput = values["allowed-origin"] as string[];
  const allowedOrigins = allowedOriginInput.flatMap(origin => origin.split(",").map(o => o.trim())).filter(Boolean);

  const result: CLIArgs = {
    debug: values.debug as boolean,
    help: values.help as boolean,
    open: values.open as boolean,
    format: format as FormatterType,
    port,
    cmd: positionals[0],
    cmdArgs: cmdArgs ?? positionals.slice(1),
    allowedOrigins,
  };

  return result;
}
// Command registry - each command provides its own metadata
export const COMMANDS: Command[] = [run, tail, mcp, server];

// Build command map from registry for fast lookup
export const CLI_CMD_MAP = new Map<string | undefined, Command["handler"]>([
  ["help", showHelp],
  ...COMMANDS.map(cmd => [cmd.meta.name, cmd.handler] as [string, Command["handler"]]),
  [undefined, server.handler],
]);

export async function main({
  basePath,
  filesToServe,
}: { basePath?: CLIHandlerOptions["basePath"]; filesToServe?: CLIHandlerOptions["filesToServe"] } = {}) {
  const { cmd, cmdArgs, help, port, debug, format, allowedOrigins, open } = parseCLIArgs();
  if (debug || process.env.SPOTLIGHT_DEBUG) {
    enableDebugLogging(true);
  }
  const spotlightVersion = process.env.npm_package_version || "{unknown}";
  logger.info(`Spotlight by Sentry - v${spotlightVersion}`);

  metrics.count("cli.invocation", 1, {
    attributes: {
      command: cmd || "server",
      format,
      debug: String(debug),
    },
  });

  // Handle help: `spotlight --help`, `spotlight help`, `spotlight help <cmd>`, or `spotlight <cmd> --help`
  if (help || cmd === "help") {
    // If `spotlight <cmd> --help`, show help for that specific command
    // If `spotlight help <cmd>`, cmdArgs[0] contains the command name
    const targetCmd = cmd === "help" ? cmdArgs[0] : cmd;
    return showHelp({
      cmd: "help",
      cmdArgs: targetCmd ? [targetCmd] : [],
      port,
      help: true,
      debug,
      format,
      basePath,
      filesToServe,
      allowedOrigins,
      open,
    });
  }

  const handler = CLI_CMD_MAP.get(cmd) || showHelp;

  return await handler({ cmd, cmdArgs, port, help, debug, format, basePath, filesToServe, allowedOrigins, open });
}
