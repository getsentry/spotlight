#!/usr/bin/env node
import { enableDebugLogging, logger } from "./logger.js";
import { parseCLIArgs } from "./main.js";
import type { CLIHandler } from "./types/cli.js";

import showHelp from "./cli/help.js";
import mcp from "./cli/mcp.js";
import run from "./cli/run.js";
import startServer from "./cli/server.js";
import tail from "./cli/tail.js";

export const CLI_CMD_MAP = new Map<string | undefined, CLIHandler>([
  ["help", showHelp],
  ["mcp", mcp],
  ["tail", tail],
  ["run", run],
  ["server", startServer],
  [undefined, startServer],
]);

export async function main({
  basePath,
  filesToServe,
}: { basePath?: string; filesToServe?: Record<string, Buffer> } = {}) {
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
