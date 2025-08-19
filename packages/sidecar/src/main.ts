import { createWriteStream, readFileSync } from "node:fs";
import { get } from "node:http";
import { extname, join, resolve } from "node:path";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { StreamableHTTPTransport } from "@hono/mcp";
import { type ServerType, serve } from "@hono/node-server";
import { addEventProcessor, captureException, getTraceData, startSpan } from "@sentry/node";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import launchEditor from "launch-editor";
import { CONTEXT_LINES_ENDPOINT, DEFAULT_PORT, SERVER_IDENTIFIER } from "./constants.js";
import { contextLinesHandler } from "./contextlines.js";
import { logIncomingEvent, logOutgoingEvent } from "./debugLogging.js";
import { EventContainer } from "./eventContainer.js";
import { type SidecarLogger, activateLogger, enableDebugLogging, logger } from "./logger.js";
import { createMcpInstance } from "./mcp/index.js";
import { generateUuidv4 } from "./messageBuffer.js";
import { streamSSE } from "./streaming.js";
import { parseBrowserFromUserAgent } from "./userAgent.js";
import { type HonoEnv, type IncomingPayloadCallback, getBuffer } from "./utils.js";

type SideCarOptions = {
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

// TODO: Add zstd support!
const decompressors: Record<string, ((buf: Buffer) => Buffer) | undefined> = {
  gzip: gunzipSync,
  deflate: inflateSync,
  br: brotliDecompressSync,
};

const withTracing =
  (fn: CallableFunction, spanArgs = {}) =>
  (...args: unknown[]) =>
    startSpan({ name: fn.name, ...spanArgs }, () => fn(...args));

const contextId = generateUuidv4();
const transport = new StreamableHTTPTransport();
const mcp = createMcpInstance();

export const app = new Hono<HonoEnv>()
  .use(contextStorage(), async (ctx, next) => {
    ctx.set("contextId", contextId);
    await next();
  })
  .all(
    "/mcp",
    async (_ctx, next) => {
      if (!mcp.isConnected()) {
        // Connecting the MCP with the transport
        await mcp.connect(transport);
      }

      await next();
    },
    ctx => transport.handleRequest(ctx),
  )
  .get("/health", ctx => ctx.text("OK"))
  .use(cors())
  .delete("/clear", ctx => {
    getBuffer().clear();
    return ctx.text("Cleared");
  })
  .get("/stream", ctx => {
    const buffer = getBuffer();

    const useBase64 = ctx.req.query("base64") != null;
    const base64Indicator = useBase64 ? ";base64" : "";

    // Capture client information for debug logging
    let clientId = ctx.req.query("client");
    if (!clientId) {
      // Fallback to parsing User-Agent if no client param
      const userAgent = ctx.req.header("User-Agent") || "unknown";
      clientId = parseBrowserFromUserAgent(userAgent);
    }
    // Sanitize to prevent log injection - keep only safe printable characters
    // Allow alphanumeric, spaces, dots, dashes, underscores, slashes, parentheses
    clientId = clientId.replace(/[^\w\s.\-/()]/g, "");
    // Ensure we always have a non-empty clientId
    if (!clientId) clientId = "unknown";

    return streamSSE(ctx, async stream => {
      const sub = buffer.subscribe(container => {
        logOutgoingEvent(container, clientId);
        stream.writeSSE({
          event: `${container.getContentType()}${base64Indicator}`,
          data: container.getData().toString(useBase64 ? "base64" : "utf-8"),
        });
      });

      stream.onAbort(() => {
        buffer.unsubscribe(sub);
      });
    });
  })
  .on("POST", ["/stream", "/api/:id/envelope"], async ctx => {
    const arrayBuffer = await ctx.req.arrayBuffer();
    let body = Buffer.from(arrayBuffer);

    // Check for gzip or deflate encoding and create appropriate stream
    const encoding = ctx.req.header("Content-Encoding");
    const decompressor = decompressors[encoding ?? ""];
    if (decompressor) {
      body = decompressor(body);
    }

    let contentType = ctx.req.header("content-type")?.split(";")[0].toLocaleLowerCase();
    if (ctx.req.query("sentry_client")?.startsWith("sentry.javascript.browser") && ctx.req.header("Origin")) {
      // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
      contentType = "application/x-sentry-envelope";
    }

    if (!contentType) {
      logger.warn("No content type, skipping payload...");
    } else {
      // Create event container and add to buffer
      const container = new EventContainer(contentType, body);

      // Log incoming event details when debug is enabled
      logIncomingEvent(container);

      getBuffer().put(container);
    }

    const incomingPayload = ctx.get("incomingPayload");

    if (process.env.SPOTLIGHT_CAPTURE || incomingPayload) {
      const timestamp = BigInt(Date.now()) * 1_000_000n + (process.hrtime.bigint() % 1_000_000n);
      const filename = `${contentType?.replace(/[^a-z0-9]/gi, "_") || "no_content_type"}-${timestamp}.txt`;

      if (incomingPayload) {
        incomingPayload(body.toString("binary"));
      } else {
        try {
          createWriteStream(filename).write(body);
          logger.info(`🗃️ Saved data to ${filename}`);
        } catch (err) {
          logger.error(`Failed to save data to ${filename}: ${err}`);
        }
      }
    }

    // 204 would be more appropriate but returning 200 to match what /envelope returns
    return ctx.body(null, 200, {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
  })
  .post("/open", async ctx => {
    const basePath = ctx.get("basePath") ?? process.cwd();

    const requestBody = await ctx.req.text();
    const targetPath = resolve(basePath, requestBody);
    logger.debug(`Launching editor for ${targetPath}`);
    launchEditor(
      // filename:line:column
      // both line and column are optional
      targetPath,
      // callback if failed to launch (optional)
      (fileName: string, errorMsg: string) => {
        logger.error(`Failed to launch editor for ${fileName}: ${errorMsg}`);
      },
    );
    return ctx.body(null, 204);
  })
  .put(CONTEXT_LINES_ENDPOINT, contextLinesHandler);

function logSpotlightUrl(port: number): void {
  logger.info(`You can open: http://localhost:${port} to see the Spotlight overlay directly`);
}

const extensionsToContentType: Record<string, string | undefined> = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

async function startServer(
  port: number,
  basePath?: string,
  filesToServe?: Record<string, Buffer>,
  incomingPayload?: IncomingPayloadCallback,
): Promise<ServerType> {
  if (basePath && !filesToServe) {
    filesToServe = {
      "/src/index.html": readFileSync(join(basePath, "src/index.html")),
      "/assets/main.js": readFileSync(join(basePath, "assets/main.js")),
    };
  }

  const server = new Hono<HonoEnv>()
    .use(async (ctx, next) => {
      ctx.header("X-Powered-By", SERVER_IDENTIFIER);

      ctx.set("basePath", basePath);
      ctx.set("incomingPayload", incomingPayload);

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
            // TODO: Figure out how to get the port
            // "server.port": ctx.req.socket.localPort,
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
              `sentrySpotlightPort;desc=${port}`,
            ].join(", "),
          );

          span.setAttribute("http.response.status_code", ctx.res.status);
        },
      );
    })
    .route("/", app);

  if (filesToServe) {
    server.get("/*", ctx => {
      let filePath = `${ctx.req.path || ctx.req.url}`;

      if (filePath === "/") {
        filePath = "/src/index.html";
      }
      filePath = filePath.slice(1);

      const extName = extname(filePath);
      const contentType = extensionsToContentType[extName] ?? "text/html";

      if (!Object.hasOwn(filesToServe, filePath)) {
        return ctx.notFound();
      }

      // Enable profiling in browser
      ctx.header("Document-Policy", "js-profiling");
      ctx.header("Content-Type", contentType);

      return ctx.body(filesToServe[filePath]);
    });
  }

  const _server = serve(
    {
      fetch: server.fetch,
      port,
    },
    () => handleServerListen(port, basePath),
  );

  _server.addListener("error", handleServerError);

  function handleServerError(e: { code?: string }): void {
    if ("code" in e && e.code === "EADDRINUSE") {
      logger.info(`Port ${port} in use, retrying...`);
      _server.close();
      portInUseRetryTimeout = setTimeout(() => {
        _server.listen(port);
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

  return _server;
}

let serverInstance: ServerType;
let portInUseRetryTimeout: NodeJS.Timeout | null = null;

const isValidPort = withTracing(
  (value: string | number) => {
    if (typeof value === "string") {
      const portNumber = Number(value);
      return /^\d+$/.test(value) && portNumber > 0 && portNumber <= 65535;
    }
    return value > 0 && value <= 65535;
  },
  { name: "isValidPort", op: "sidecar.server.portCheck" },
);

const isSidecarRunning = withTracing(
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
      healthReq.on("error", () => {
        resolve(false);
      });
      healthReq.end();
    }),
  { name: "isSidecarRunning", op: "sidecar.server.collideCheck" },
);

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
      serverInstance = await startServer(sidecarPort, basePath, filesToServe, incomingPayload);
    }
  });
}

export function clearBuffer(): void {
  getBuffer(contextId).reset();
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
