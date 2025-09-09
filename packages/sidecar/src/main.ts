import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type ServerType, serve } from "@hono/node-server";
import { addEventProcessor, captureException, getTraceData, startSpan } from "@sentry/node";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { DEFAULT_PORT, SERVER_IDENTIFIER } from "./constants.js";
import { serveFilesHandler } from "./handlers/index.js";
import { activateLogger, enableDebugLogging, logger } from "./logger.js";
import routes, { CONTEXT_ID } from "./routes/index.js";
import type { HonoEnv, SideCarOptions, StartServerOptions } from "./types/index.js";
import { getBuffer, isSidecarRunning, isValidPort, logSpotlightUrl } from "./utils/index.js";

let serverInstance: ServerType;
let portInUseRetryTimeout: NodeJS.Timeout | null = null;

function startServer(options: StartServerOptions): ServerType {
  let filesToServe = options.filesToServe;

  if (options.basePath && !filesToServe) {
    filesToServe = {
      "/src/index.html": readFileSync(join(options.basePath, "src/index.html")),
      "/assets/main.js": readFileSync(join(options.basePath, "assets/main.js")),
    };
  }

  const app = new Hono<HonoEnv>().use(cors());

  app
    .use(async (ctx, next) => {
      ctx.header("X-Powered-By", SERVER_IDENTIFIER);

      ctx.set("basePath", options.basePath);
      ctx.set("incomingPayload", options.incomingPayload);

      const host = ctx.req.header("Host") || "localhost";
      const path = ctx.req.path;
      await startSpan(
        {
          name: `HTTP ${ctx.req.method} ${path}`,
          op: `sidecar.http.${ctx.req.method?.toLowerCase()}`,
          forceTransaction: true,
          attributes: {
            "http.request.method": ctx.req.method,
            "http.request.url": ctx.req.url,
            "http.request.query": ctx.req.query().toString(),
            "server.address": host,
            "server.port": ctx.env.incoming.socket.localPort,
          },
        },
        async span => {
          if (path === "/mcp" || path === "/health") {
            await next();
          } else {
            await startSpan({ name: "enableCORS", op: "sidecar.http.middleware.cors" }, () => next());
          }

          const traceData = getTraceData();
          ctx.res.headers.append(
            "server-timing",
            [
              `sentryTrace;desc="${traceData["sentry-trace"]}"`,
              `baggage;desc="${traceData.baggage}"`,
              `sentrySpotlightPort;desc=${options.port}`,
            ].join(", "),
          );

          span.setAttribute("http.response.status_code", ctx.res.status);
        },
      );
    })
    .route("/", routes);

  if (filesToServe) {
    app.get("/*", serveFilesHandler(filesToServe));
  }

  const sidecarServer = serve(
    {
      fetch: app.fetch,
      port: options.port,
    },
    () => handleServerListen(options.port, options.basePath),
  );

  sidecarServer.addListener("error", handleServerError);

  function handleServerError(e: { code?: string }): void {
    if ("code" in e && e.code === "EADDRINUSE") {
      logger.info(`Port ${options.port} in use, retrying...`);
      sidecarServer.close();
      portInUseRetryTimeout = setTimeout(() => {
        sidecarServer.listen(options.port);
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

  return sidecarServer;
}

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

  isSidecarRunning(sidecarPort).then(async (isRunning: boolean) => {
    if (isRunning) {
      logger.info(`Sidecar is already running on port ${sidecarPort}`);
      const hasSpotlightUI = (filesToServe && "/src/index.html" in filesToServe) || (!filesToServe && basePath);
      if (hasSpotlightUI) {
        logSpotlightUrl(sidecarPort);
      }
    } else if (!serverInstance) {
      serverInstance = startServer({ port: sidecarPort, basePath, filesToServe, incomingPayload });
    }
  });
}

export function clearBuffer(): void {
  getBuffer(CONTEXT_ID).reset();
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
    // TODO: This doesn't exist
    // serverInstance.closeAllConnections();
    serverInstance.unref();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
