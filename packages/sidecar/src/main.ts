import { createWriteStream } from "node:fs";
import { get } from "node:http";
import { resolve } from "node:path";
import { createGunzip, createInflate } from "node:zlib";
import { type HttpBindings, type ServerType, serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { addEventProcessor, captureException, startSpan } from "@sentry/node";
import { type Handler, Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import launchEditor from "launch-editor";
import { CONTEXT_LINES_ENDPOINT, DEFAULT_PORT, SERVER_IDENTIFIER } from "./constants.js";
import { contextLinesHandler } from "./contextlines.js";
import { type SidecarLogger, activateLogger, enableDebugLogging, logger } from "./logger.js";
import { MessageBuffer } from "./messageBuffer.js";

type Payload = [string, Buffer];

type IncomingPayloadCallback = (body: string) => void;

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

  filesToServe?: string[];

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

const withTracing =
  (fn: CallableFunction, spanArgs = {}) =>
  (...args: unknown[]) =>
    startSpan({ name: fn.name, ...spanArgs }, () => fn(...args));

const streamGetRequestHandler = (buffer: MessageBuffer<Payload>): Handler => {
  return function handleStreamRequest(c) {
    // TODO: Check if we still need this
    // // Send something in the body to trigger the `open` event
    // // This is mostly for Firefox -- see getsentry/spotlight#376
    // res.write("\n");
    const useBase64 = c.req.query("base64") != null;
    const base64Indicator = useBase64 ? ";base64" : "";
    return streamSSE(c, async stream => {
      const dataWriter = useBase64
        ? (data: Buffer) => [`data:${data.toString("base64")}`]
        : (data: Buffer) => {
            const _data = [];
            // The utf-8 encoding here is wrong and is a hack as we are
            // sending binary data as utf-8 over SSE which enforces utf-8
            // encoding. This is only for backwards compatibility
            for (const line of data.toString("utf-8").split("\n")) {
              // This is very important - SSE events are delimited by two newlines
              _data.push(`data:${line}`);
            }

            return _data;
          };

      const sub = buffer.subscribe(([payloadType, data]) => {
        logger.debug("🕊️ sending to Spotlight");
        stream.writeln(`event:${payloadType}${base64Indicator}`);
        for (const line of dataWriter(data)) {
          stream.writeln(line);
        }
        // This last \n is important as every message ends with an empty line in SSE
        stream.write("\n");
      });

      stream.onAbort(() => {
        buffer.unsubscribe(sub);
      });
    });
  };
};

const streamPostRequestHandler = (
  buffer: MessageBuffer<Payload>,
  incomingPayload?: IncomingPayloadCallback,
): Handler<{ Bindings: HttpBindings }> => {
  return async function handleStreamRequest(c) {
    logger.debug("📩 Received event");
    let stream = c.env.incoming;
    // Check for gzip or deflate encoding and create appropriate stream
    const encoding = c.req.header("content-encoding");
    if (encoding === "gzip") {
      // @ts-ignore
      stream = c.env.incoming.pipe(createGunzip());
    } else if (encoding === "deflate") {
      // @ts-ignore
      stream = c.env.incoming.pipe(createInflate());
    }
    // TODO: Add brotli and zstd support!

    // Read the (potentially decompressed) stream
    const buffers: Buffer[] = [];
    stream.on("readable", () => {
      while (true) {
        const chunk = stream.read();
        if (chunk === null) {
          break;
        }
        buffers.push(chunk);
      }
    });

    stream.on("end", () => {
      const body = Buffer.concat(buffers);
      let contentType = c.req.header("content-type")?.split(";")[0].toLocaleLowerCase();
      if (c.req.query("sentry_client")?.startsWith("sentry.javascript.browser") && c.req.header("Origin")) {
        // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
        contentType = "application/x-sentry-envelope";
      }
      if (!contentType) {
        logger.warn("No content type, skipping payload...");
      } else {
        buffer.put([contentType, body]);
      }

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
      return c.body(null, 200, {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
    });
  };
};

const handleHealthRequest: Handler = c => c.text("OK");

const handleClearRequest: Handler = c => {
  clearBuffer();
  return c.text("Cleared");
};

function openRequestHandler(basePath: string = process.cwd()): Handler {
  return async c => {
    const requestBody = await c.req.text();
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
    return c.body(null, 204);
  };
}

function logSpotlightUrl(port: number): void {
  logger.info(`You can open: http://localhost:${port} to see the Spotlight overlay directly`);
}

function startServer(
  buffer: MessageBuffer<Payload>,
  port: number,
  basePath?: string,
  filesToServe?: string[],
  incomingPayload?: IncomingPayloadCallback,
) {
  if (basePath && !filesToServe) {
    filesToServe = ["/src/index.html", "/assets/main.js"];
  }

  const server = new Hono();

  server.use(cors(), async (c, next) => {
    c.header("X-Powered-By", SERVER_IDENTIFIER);
    await next();
  });

  server.get("/health", handleHealthRequest);

  server.use(async (_c, next) => {
    startSpan({ name: "enableCORS", op: "sidecar.http.middleware.cors" }, async () => await next());
  });

  server.delete("/clear", handleClearRequest);
  server.get("/stream", streamGetRequestHandler(buffer));
  server.on("POST", ["/stream", "/api/:id/envelope"], streamPostRequestHandler(buffer, incomingPayload));
  server.post("/open", openRequestHandler(basePath));
  server.put(CONTEXT_LINES_ENDPOINT, contextLinesHandler);

  if (filesToServe) {
    for (const path of filesToServe) {
      let url = path;

      if (url === "/src/index.html") {
        url = "/";
      }

      server.get(url, serveStatic({ root: basePath, path }));
    }
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
const buffer: MessageBuffer<Payload> = new MessageBuffer<Payload>();

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
    // TODO: This doesn't exist
    // serverInstance.closeAllConnections();
    serverInstance.unref();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
