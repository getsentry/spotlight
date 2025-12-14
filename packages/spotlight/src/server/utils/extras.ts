import { exec } from "node:child_process";
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

  let command: string;

  if (platform === "darwin") {
    command = `open "${url}"`;
  } else if (platform === "win32") {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  logger.info(`Opening ${url} in your browser...`);

  // Use exec() for better cross-runtime compatibility (Node.js, bun, deno, etc.)
  // exec() runs the command in a shell, which handles PATH resolution correctly
  exec(command, error => {
    if (error) {
      logger.warn(`Unable to open browser automatically: ${error.message}`);
      logger.info(`Please open ${url} manually in your browser.`);
    }
  });
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
