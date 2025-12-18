import { spawn } from "node:child_process";
import { get } from "node:http";
import { startSpan } from "@sentry/node";
import { SERVER_IDENTIFIER } from "../constants.ts";
import { logger } from "../logger.ts";

export const withTracing =
  (fn: CallableFunction, spanArgs = {}) =>
  (...args: unknown[]) =>
    startSpan({ name: fn.name, ...spanArgs }, () => fn(...args));

export const getSpotlightURL = (port: number, host = "localhost") => `http://${host}:${port}/stream`;

export function getSpotlightWebUrl(port: number): string {
  return `http://localhost:${port}`;
}

export function logSpotlightUrl(port: number): void {
  logger.info(`Open ${getSpotlightWebUrl(port)} to see the Spotlight UI`);
}

export function openInBrowser(port: number): void {
  const url = getSpotlightWebUrl(port);
  const platform = process.platform;

  let cmd: string;
  let args: string[];

  if (platform === "darwin") {
    cmd = "open";
    args = [url];
  } else if (platform === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }

  const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
  // Handle spawn errors gracefully (e.g., command not found in minimal environments)
  child.on("error", err => {
    logger.debug(`Failed to open browser: ${err.message}`);
  });
  child.unref();
}

export const isValidPort = withTracing(
  (value: string | number) => {
    if (typeof value === "string") {
      const portNumber = Number(value);
      return /^\d+$/.test(value) && portNumber > 0 && portNumber <= 65535;
    }
    return value > 0 && value <= 65535;
  },
  { name: "isValidPort", op: "sidecar.server.portCheck" },
);

export const isSidecarRunning = withTracing(
  (port: string | number | undefined) =>
    new Promise(_resolve => {
      logger.debug(`Checking if we are already running on port ${port}`);
      const options = {
        hostname: "localhost",
        port: port,
        path: "/health",
        method: "GET",
        // This is only the socket timeout so set up
        // a connection timeout below manually
        timeout: 1000,
        headers: { Connection: "close" },
      };

      let timeoutId: NodeJS.Timeout | null = null;
      const healthReq = get(options, res => {
        const serverIdentifier = res.headers["x-powered-by"];
        resolve(serverIdentifier === SERVER_IDENTIFIER);
      });
      const destroyHealthReq = () => !healthReq.destroyed && healthReq.destroy(new Error("Request timed out."));
      function resolve(value: boolean) {
        process.off("SIGINT", destroyHealthReq);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        _resolve(value);
      }
      process.on("SIGINT", destroyHealthReq);
      timeoutId = setTimeout(destroyHealthReq, 2000);
      timeoutId.unref();
      healthReq.on("error", () => {
        resolve(false);
      });
      healthReq.end();
    }),
  { name: "isSidecarRunning", op: "sidecar.server.collideCheck" },
);
