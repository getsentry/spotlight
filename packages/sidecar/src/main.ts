import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { addEventProcessor, captureException, getTraceData, startSpan } from "@sentry/node";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DEFAULT_PORT, SERVER_IDENTIFIER } from "./constants.js";
import { serveFilesHandler } from "./handlers/index.js";
import { activateLogger, logger } from "./logger.js";
import routes from "./routes/index.js";
import type { HonoEnv, SideCarOptions, StartServerOptions } from "./types/index.js";
import { getBuffer, isSidecarRunning, isValidPort, logSpotlightUrl } from "./utils/index.js";
import type { Server } from "node:http";

let portInUseRetryTimeout: NodeJS.Timeout | null = null;

const MAX_RETRIES = 3;
export async function startServer(options: StartServerOptions): Promise<Server> {
  const { port, basePath } = options;
  let filesToServe = options.filesToServe;
  if (!filesToServe && basePath) {
    try {
      filesToServe = {
        "/src/index.html": readFileSync(join(basePath, "src/index.html")),
        "/assets/main.js": readFileSync(join(basePath, "assets/main.js")),
      };
    } catch {
      // pass -- no UI
    }
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
              `sentrySpotlightPort;desc=${ctx.env.incoming.socket.localPort}`,
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

  let resolve: (value: Server) => void;
  let reject!: (err: Error) => void;
  const promise = new Promise<Server>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const sidecarServer = serve(
    {
      fetch: app.fetch,
      port,
    },
    () => {
      const realPort = (sidecarServer.address() as AddressInfo).port;
      logger.info(`Sidecar listening on ${realPort}`);
      if (basePath) {
        logSpotlightUrl(realPort);
      }
      resolve(sidecarServer as Server);
    },
  );
  sidecarServer.addListener("error", handleServerError);

  let retries = 0;
  function handleServerError(err: { code?: string }): void {
    if ("code" in err && err.code === "EADDRINUSE") {
      logger.info(`Port ${options.port} in use, retrying...`);
      sidecarServer.close();

      retries++;
      if (retries > MAX_RETRIES) {
        reject(err as Error);
        return;
      }

      if (portInUseRetryTimeout) {
        clearTimeout(portInUseRetryTimeout);
      }
      portInUseRetryTimeout = setTimeout(() => {
        sidecarServer.listen(options.port);
      }, 5000);
      portInUseRetryTimeout.unref();
    } else {
      captureException(err);
      reject(err as Error);
    }
  }

  return promise;
}

export async function setupSidecar(
  { port, logger: customLogger, basePath, filesToServe, incomingPayload, isStandalone }: SideCarOptions = {
    port: DEFAULT_PORT,
  },
): Promise<Server | undefined> {
  if (!isStandalone) {
    addEventProcessor(event => (event.spans?.some(span => span.op?.startsWith("sidecar.")) ? null : event));
  }

  if (customLogger) {
    activateLogger(customLogger);
  }

  if (port && !isValidPort(port)) {
    throw new Error(`Invalid port number: ${port}. Must be between 1 and 65535, or 0 for automatic assignment.`);
  }

  if (port > 0 && (await isSidecarRunning(port))) {
    logger.info(`Sidecar is already running on port ${port}`);
    const hasSpotlightUI = (filesToServe && "/src/index.html" in filesToServe) || (!filesToServe && basePath);
    if (hasSpotlightUI) {
      logSpotlightUrl(port);
    }
    return;
  }
  const serverInstance = await startServer({
    port,
    basePath,
    filesToServe,
    incomingPayload,
  });
  setShutdownHandlers(serverInstance);
  return serverInstance;
}

export function clearBuffer(): void {
  getBuffer().reset();
}

export function setShutdownHandlers(server: Server): void {
  let forceShutdown = false;
  const shutdown = () => {
    if (forceShutdown) {
      logger.info("Bye.");
      process.exit(0);
    }

    forceShutdown = true;
    logger.info("Shutting down server gracefully...");
    server.close();
    server.closeAllConnections();
    server.unref();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
