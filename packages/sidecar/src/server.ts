import { readFileSync } from "node:fs";
import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import { join } from "node:path";
import { addEventProcessor, captureException, startSpan } from "@sentry/node";
import { CONTEXT_LINES_ENDPOINT, DEFAULT_PORT } from "./constants.js";
import { contextLinesHandler } from "./contextlines.js";
import { type SidecarLogger, activateLogger, enableDebugLogging, logger } from "./logger.js";
import { MessageBuffer } from "./messageBuffer.js";
import {
  createClearHandler,
  createFileServerHandler,
  handleHealthRequest,
  openRequestHandler,
  streamRequestHandler,
} from "./tools.js";
import {
  type RequestHandler,
  addServerTiming,
  enableCORS,
  error404,
  isSidecarRunning,
  isValidPort,
  logSpotlightUrl,
} from "./utils.js";

type Payload = [string, Buffer];
type IncomingPayloadCallback = (body: string) => void;

export type SideCarOptions = {
  /**
   * The port on which the sidecar should listen.
   * Defaults to 8969.
   */
  port?: string | number;

  /**
   * A logger that implements the SidecarLogger interface.
   * Use this to inject your custom logger implementation.
   *
   * @default - a simple logger logging to the console.
   */
  logger?: SidecarLogger;

  /**
   * The base path from where the static files should be served.
   */
  basePath?: string;

  filesToServe?: Record<string, Buffer>;

  /**
   * More verbose logging.
   */
  debug?: boolean;

  /**
   * A callback that will be called with the incoming message.
   * Helpful for debugging.
   */
  incomingPayload?: IncomingPayloadCallback;

  isStandalone?: boolean;
};

function createRoutes(
  buffer: MessageBuffer<Payload>,
  basePath?: string,
  filesToServe?: Record<string, Buffer>,
  incomingPayload?: IncomingPayloadCallback,
): [RegExp, RequestHandler][] {
  const routes: [RegExp, RequestHandler][] = [
    [/^\/health$/, handleHealthRequest],
    [/^\/clear$/, enableCORS(createClearHandler(() => clearBuffer()))],
    [/^\/stream$|^\/api\/\d+\/envelope\/?$/, enableCORS(streamRequestHandler(buffer, incomingPayload))],
    [/^\/open$/, enableCORS(openRequestHandler(basePath))],
    [RegExp(`^${CONTEXT_LINES_ENDPOINT}$`), enableCORS(contextLinesHandler)],
  ];

  // Add file server route if files are available
  if (filesToServe != null) {
    routes.push([/^.+$/, enableCORS(createFileServerHandler(filesToServe))]);
  } else {
    routes.push([/^.+$/, error404]);
  }

  return routes;
}

function startServer(
  buffer: MessageBuffer<Payload>,
  port: number,
  basePath?: string,
  filesToServe?: Record<string, Buffer>,
  incomingPayload?: IncomingPayloadCallback,
): Server {
  if (basePath && !filesToServe) {
    filesToServe = {
      "/src/index.html": readFileSync(join(basePath, "src/index.html")),
      "/assets/main.js": readFileSync(join(basePath, "assets/main.js")),
    };
  }

  const ROUTES = createRoutes(buffer, basePath, filesToServe, incomingPayload);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url;
    if (!url) {
      return error404(req, res);
    }

    const host = req.headers.host || "localhost";
    const { pathname, searchParams } = new URL(url, `http://${host}`);
    const route = ROUTES.find(route => route[0].test(pathname));
    if (!route) {
      return error404(req, res);
    }
    return startSpan(
      {
        name: `HTTP ${req.method} ${pathname}`,
        op: `sidecar.http.${req.method?.toLowerCase()}`,
        forceTransaction: true,
        attributes: {
          "http.request.method": req.method,
          "http.request.url": url,
          "http.request.query": searchParams.toString(),
          "server.address": host,
          "server.port": req.socket.localPort,
        },
      },
      span => {
        addServerTiming(res, port);
        const result = route[1](req, res, pathname, searchParams);
        span.setAttribute("http.response.status_code", res.statusCode);
        return result;
      },
    );
  });

  server.on("error", handleServerError);

  server.listen(port, () => {
    handleServerListen(port, basePath);
  });

  return server;

  function handleServerError(e: { code?: string }): void {
    if ("code" in e && e.code === "EADDRINUSE") {
      logger.info(`Port ${port} in use, retrying...`);
      server.close();
      portInUseRetryTimeout = setTimeout(() => {
        server.listen(port);
      }, 5000);
    } else {
      captureException(e);
    }
  }

  function handleServerListen(port: number, basePath?: string): void {
    logger.info(`Sidecar listening on ${port}`);
    if (basePath) {
      logSpotlightUrl(port);
    }
  }
}

let serverInstance: Server;
let portInUseRetryTimeout: NodeJS.Timeout | null = null;
const buffer: MessageBuffer<Payload> = new MessageBuffer<Payload>();

export function setupSidecar({
  port,
  logger: customLogger,
  basePath,
  filesToServe,
  debug,
  incomingPayload,
  isStandalone,
}: SideCarOptions = {}): void {
  if (!isStandalone) {
    addEventProcessor(event => (event.spans?.some(span => span.op?.startsWith("sidecar.")) ? null : event));
  }
  let sidecarPort = DEFAULT_PORT;

  if (customLogger) {
    activateLogger(customLogger);
  }

  if (debug || process.env.SPOTLIGHT_DEBUG) {
    enableDebugLogging(true);
  }

  if (port && !isValidPort(port)) {
    logger.info("Please provide a valid port.");
    process.exit(1);
  } else if (port) {
    sidecarPort = typeof port === "string" ? Number(port) : port;
  }

  isSidecarRunning(sidecarPort).then((isRunning: boolean) => {
    if (isRunning) {
      logger.info(`Sidecar is already running on port ${sidecarPort}`);
      const hasSpotlightUI = (filesToServe && "/src/index.html" in filesToServe) || (!filesToServe && basePath);
      if (hasSpotlightUI) {
        logSpotlightUrl(sidecarPort);
      }
    } else if (!serverInstance) {
      serverInstance = startServer(buffer, sidecarPort, basePath, filesToServe, incomingPayload);
    }
  });
}

export function clearBuffer(): void {
  buffer.clear();
}

let forceShutdown = false;
export const shutdown = () => {
  if (portInUseRetryTimeout) {
    clearTimeout(portInUseRetryTimeout);
  }
  if (forceShutdown || !serverInstance) {
    logger.info("Bye.");
    process.exit(0);
  }
  if (serverInstance) {
    forceShutdown = true;
    logger.info("Shutting down server gracefully...");
    serverInstance.close();
    serverInstance.closeAllConnections();
    serverInstance.unref();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
