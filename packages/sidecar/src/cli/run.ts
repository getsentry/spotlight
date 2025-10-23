import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { logger } from "../logger.js";
import type { CLIHandlerOptions } from "../types/cli.js";
import { getSpotlightURL } from "../utils/extras.js";
import tail from "./tail.js";
import type { AddressInfo } from "node:net";

export default async function run({ port, cmdArgs, basePath, filesToServe }: CLIHandlerOptions) {
  const serverInstance = await tail({ port, cmdArgs: [], basePath, filesToServe });
  if (!serverInstance) {
    logger.error("Failed to start Spotlight sidecar server.");
    process.exit(1);
  }

  const actualServerPort = (serverInstance.address() as AddressInfo).port;
  let shell = false;
  const env = {
    ...process.env,
    SENTRY_SPOTLIGHT: getSpotlightURL(actualServerPort),
    // This is not supported in all SDKs but worth adding
    // for the ones that support it
    SENTRY_TRACES_SAMPLE_RATE: "1",
    //  Consider setting SENTRY_DSN to our hack server too?
  } as { PATH: string; SENTRY_SPOTLIGHT: string; SENTRY_TRACES_SAMPLE_RATE: string; [key: string]: string };
  if (cmdArgs.length === 0) {
    // try package.json to find default dev command
    try {
      const scripts = JSON.parse(readFileSync("./package.json", "utf-8")).scripts;
      cmdArgs = [scripts.dev ?? scripts.develop ?? scripts.serve ?? scripts.start];
      shell = true;
      env.PATH = path.resolve("./node_modules/.bin") + path.delimiter + env.PATH;
    } catch {
      // pass
    }
  }
  if (cmdArgs.length === 0) {
    // try to see if this is a docker-compose project
    try {
      // TODO: Check docker-compose.yml existence
      // TODO: Check docker-compose.yaml existence
      // TODO: Check `docker compose --version` existence
      // TODO: Check `docker-compose --version` existence
    } catch {
      // pass
    }
  }
  if (cmdArgs.length === 0) {
    logger.error("Error: No command specified to run and could not infer the command automatically.");
    process.exit(1);
  }
  const cmdStr = cmdArgs.join(" ");
  logger.info(`Starting command: ${cmdStr}`);
  // TODO: Run this _after_ the server is started
  const runCmd = spawn(cmdArgs[0], cmdArgs.slice(1), {
    cwd: process.cwd(),
    env,
    shell,
    windowsVerbatimArguments: true,
    windowsHide: true,
    // TODO: Consider using pipe and forwarding output as logs to Spotlight
    stdio: "ignore",
  });
  runCmd.on("error", err => {
    logger.error(`Failed to run ${cmdStr}:`);
    logger.error(err);
    process.exit(1);
  });
  runCmd.on("close", code => {
    if (!code) {
      logger.error(`${cmdStr} exited, terminating.`);
    } else {
      logger.error(`${cmdStr} exited with code ${code}.`);
    }
    process.exit(code);
  });
  const killRunCmd = () => {
    runCmd.removeAllListeners();
    runCmd.kill();
  };
  runCmd.on("spawn", () => {
    runCmd.removeAllListeners("error");
    process.on("SIGINT", killRunCmd);
    process.on("SIGTERM", killRunCmd);
    process.on("beforeExit", killRunCmd);
  });
}
