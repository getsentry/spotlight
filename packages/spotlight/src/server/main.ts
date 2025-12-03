import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { addEventProcessor, captureException, getTraceData, startSpan } from "@sentry/node";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DEFAULT_PORT, SERVER_IDENTIFIER } from "./constants.ts";
import { serveFilesHandler } from "./handlers/index.ts";
import { activateLogger, logger } from "./logger.ts";
import routes from "./routes/index.ts";
import type { HonoEnv, SideCarOptions, StartServerOptions } from "./types/index.ts";
import { getBuffer, isAllowedOrigin, isSidecarRunning, isValidPort, logSpotlightUrl } from "./utils/index.ts";

let portInUseRetryTimeout: NodeJS.Timeout | null = null;

const MAX_RETRIES = 3;
export async function startServer(options: StartServerOptions): Promise<Server> {
  const { port, basePath } = options;
  let filesToServe = options.filesToServe;
  if (!filesToServe && basePath) {
    try {
      filesToServe = {
        "index.html": readFileSync(join(basePath, "index.html")),
        "assets/main.js": readFileSync(join(basePath, "assets/main.js")),
      };
    } catch {
      // pass -- no UI
    }
  }

  const app = new Hono<HonoEnv>().use(
    cors({
      origin: async origin => ((await isAllowedOrigin(origin, options.allowedOrigins)) ? origin : null),
    }),
  );

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
          const traceData = getTraceData();
          ctx.header(
            "server-timing",
            [
              `sentryTrace;desc="${traceData["sentry-trace"]}"`,
              `baggage;desc="${traceData.baggage}"`,
              `sentrySpotlightPort;desc=${ctx.env.incoming.socket.localPort}`,
            ].join(", "),
          );

          if (path === "/mcp" || path === "/health") {
            await next();
          } else {
            await startSpan({ name: "enableCORS", op: "sidecar.http.middleware.cors" }, () => next());
          }

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
  const server = serve(
    {
      fetch: app.fetch,
      port,
    },
    () => {
      const realPort = (server.address() as AddressInfo).port;
      logger.info(`Spotlight listening on ${realPort}`);
      if (basePath) {
        logSpotlightUrl(realPort);
      }
      resolve(server as Server);
    },
  );
  server.addListener("error", handleServerError);

  let retries = 0;
  function handleServerError(err: { code?: string }): void {
    if ("code" in err && err.code === "EADDRINUSE") {
      logger.info(`Port ${options.port} in use, retrying...`);
      server.close();

      retries++;
      if (retries > MAX_RETRIES) {
        reject(err as Error);
        return;
      }

      if (portInUseRetryTimeout) {
        clearTimeout(portInUseRetryTimeout);
      }
      portInUseRetryTimeout = setTimeout(() => {
        server.listen(options.port);
      }, 5000);
      portInUseRetryTimeout.unref();
    } else {
      captureException(err);
      reject(err as Error);
    }
  }

  return promise;
}

export async function setupSpotlight(
  {
    port,
    logger: customLogger,
    basePath,
    filesToServe,
    incomingPayload,
    isStandalone,
    allowedOrigins,
  }: SideCarOptions = {
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
    logger.info(`Spotlight is already running on port ${port}`);
    const hasSpotlightUI = (filesToServe && "index.html" in filesToServe) || (!filesToServe && basePath);
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
    allowedOrigins,
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
