import { type IncomingMessage, type ServerResponse, get } from "node:http";
import { extname } from "node:path";
import { getTraceData, startSpan } from "@sentry/node";
import { SERVER_IDENTIFIER } from "./constants.js";
import { logger } from "./logger.js";

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  pathname?: string,
  searchParams?: URLSearchParams,
) => void;

export const withTracing =
  (fn: CallableFunction, spanArgs = {}) =>
  (...args: unknown[]) =>
    startSpan({ name: fn.name, ...spanArgs }, () => fn(...args));

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS,DELETE,PATCH",
} as const;

export const SPOTLIGHT_HEADERS = {
  "X-Powered-by": SERVER_IDENTIFIER,
} as const;

export const enableCORS = (handler: RequestHandler): RequestHandler =>
  withTracing(
    (req: IncomingMessage, res: ServerResponse, pathname?: string, searchParams?: URLSearchParams) => {
      const headers = {
        ...CORS_HEADERS,
        ...SPOTLIGHT_HEADERS,
      };
      for (const [header, value] of Object.entries(headers)) {
        res.setHeader(header, value);
      }
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Cache-Control": "no-cache",
        });
        res.end();
        return;
      }
      return handler(req, res, pathname, searchParams);
    },
    { name: "enableCORS", op: "sidecar.http.middleware.cors" },
  );

export function errorResponse(code: number) {
  return withTracing(
    (_req: IncomingMessage, res: ServerResponse) => {
      res.writeHead(code);
      res.end();
    },
    { name: `HTTP ${code}`, op: `sidecar.http.error.${code}`, attributes: { "http.response.status_code": code } },
  );
}

export const error404 = errorResponse(404);
export const error405 = errorResponse(405);

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
      logger.info(`Checking if we are already running on port ${port}`);
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
        if (serverIdentifier === "spotlight-by-sentry") {
          resolve(true);
        } else {
          resolve(false);
        }
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
      healthReq.on("error", () => {
        resolve(false);
      });
      healthReq.end();
    }),
  { name: "isSidecarRunning", op: "sidecar.server.collideCheck" },
);

export function getContentType(filePath: string): string {
  const extName = extname(filePath);
  switch (extName) {
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    default:
      return "text/html";
  }
}

export function logSpotlightUrl(port: number): void {
  logger.info(`You can open: http://localhost:${port} to see the Spotlight overlay directly`);
}

export function addServerTiming(res: ServerResponse, port: number): void {
  const traceData = getTraceData();
  res.appendHeader(
    "server-timing",
    [
      `sentryTrace;desc="${traceData["sentry-trace"]}"`,
      `baggage;desc="${traceData.baggage}"`,
      `sentrySpotlightPort;desc=${port}`,
    ].join(", "),
  );
}
