import { type ServerType, serve } from "@hono/node-server";
import { addEventProcessor, captureException, getTraceData, startSpan } from "@sentry/node";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DEFAULT_PORT, SERVER_IDENTIFIER } from "./constants.js";
import { serveFilesHandler } from "./handlers/index.js";
import { activateLogger, enableDebugLogging, logger } from "./logger.js";
import { createMCPInstance } from "./mcp/mcp.js";
import routes from "./routes/index.js";
import type { HonoEnv, SideCarOptions, StartServerOptions } from "./types/index.js";
import { getBuffer, isSidecarRunning, isValidPort, logSpotlightUrl } from "./utils/index.js";
import { inspect, parseArgs } from "node:util";
import { ServerType as ProxyServerType, startStdioServer } from "mcp-proxy";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { util } from "zod";

const PARSE_ARGS_CONFIG = {
  options: {
    port: {
      type: "string",
      short: "p",
      default: DEFAULT_PORT.toString(),
    },
    debug: {
      type: "boolean",
      short: "d",
      default: false,
    },
    // Deprecated -- use the positional `mcp` argument instead
    "stdio-mcp": {
      type: "boolean",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
  },
  allowPositionals: true,
  strict: true,
} as const;

export type CLIArgs = {
  port: number;
  debug: boolean;
  help: boolean;
  cmd: string | undefined;
  cmdArgs: string[];
};

let serverInstance: ServerType;
let portInUseRetryTimeout: NodeJS.Timeout | null = null;

export function parseCLIArgs(): CLIArgs {
  const args = Array.from(process.argv);
  let cmdArgs: string[] | undefined = undefined;
  const runIndex = args.findIndex(arg => arg === "run");
  if (runIndex > -1) {
    const cutOff = args.findIndex((arg, idx) => idx > runIndex && !arg.startsWith("-"));
    cmdArgs = cutOff > runIndex ? args.splice(cutOff) : [];
  }
  const { values, positionals } = parseArgs({
    args: args.slice(2),
    ...PARSE_ARGS_CONFIG,
  });

  if (runIndex > -1 && positionals[0] !== "run") {
    throw Error(
      `CLI parse error: ${inspect({
        argv: process.argv,
        values,
        positionals,
      })}`,
    );
  }

  // Handle legacy positional argument for port (backwards compatibility)
  const portInput = positionals.length === 1 && /^\d{1,5}$/.test(positionals[0]) ? positionals.shift() : values.port;
  const port = Number(portInput);

  if (Number.isNaN(port)) {
    // Validate port number
    console.error(`Error: Invalid port number '${portInput}'`);
    console.error("Port must be a valid number between 1 and 65535");
    process.exit(1);
  }

  if (port < 1 || port > 65535) {
    console.error(`Error: Port ${port} is out of valid range (1-65535)`);
    process.exit(1);
  }

  if (values["stdio-mcp"]) {
    positionals.unshift("mcp");
    console.warn("Warning: --stdio-mcp is deprecated. Please use the positional argument 'mcp' instead.");
  }

  const result: CLIArgs = {
    debug: values.debug as boolean,
    help: values.help as boolean,
    port,
    cmd: positionals[0],
    cmdArgs: cmdArgs ?? positionals.slice(1),
  };

  return result;
}

async function startServer(options: StartServerOptions): Promise<ServerType> {
  const { port, basePath } = options;
  const filesToServe =
    basePath && !options.filesToServe
      ? {
          "/src/index.html": readFileSync(join(basePath, "src/index.html")),
          "/assets/main.js": readFileSync(join(basePath, "assets/main.js")),
        }
      : options.filesToServe;

  const app = new Hono<HonoEnv>().use(cors());

  app
    .use(async (ctx, next) => {
      ctx.header("X-Powered-By", SERVER_IDENTIFIER);

      ctx.set("basePath", options.basePath);
      ctx.set("incomingPayload", options.incomingPayload);
      ctx.set("onEnvelope", options.onEnvelope);

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

  let resolve: (value: ServerType) => void;
  let reject: (err: Error) => void;
  const promise = new Promise<ServerType>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const sidecarServer = serve(
    {
      fetch: app.fetch,
      port,
    },
    () => {
      logger.info(`Sidecar listening on ${port}`);
      if (basePath) {
        logSpotlightUrl(port);
      }
      resolve(sidecarServer);
    },
  );

  sidecarServer.addListener("error", handleServerError);

  function handleServerError(err: { code?: string }): void {
    if ("code" in err && err.code === "EADDRINUSE") {
      logger.info(`Port ${options.port} in use, retrying...`);
      sidecarServer.close();
      portInUseRetryTimeout = setTimeout(() => {
        sidecarServer.listen(options.port);
      }, 5000);
    } else {
      captureException(err);
      reject(err as Error);
    }
  }

  if (options.stdioMCP) {
    logger.info("Starting MCP over stdio too...");
    try {
      await createMCPInstance().connect(new StdioServerTransport());
    } catch (err) {
      logger.error(`Failed to connect MCP over stdio: ${(err as Error).message}`);
      captureException(err);
      reject(err as Error);
    }
  }

  return promise;
}

export async function setupSidecar({
  port,
  logger: customLogger,
  basePath,
  filesToServe,
  debug,
  onEnvelope,
  incomingPayload,
  isStandalone,
  stdioMCP,
}: SideCarOptions = {}): Promise<void> {
  if (!isStandalone) {
    addEventProcessor(event => (event.spans?.some(span => span.op?.startsWith("sidecar.")) ? null : event));
  }
  let sidecarPort = DEFAULT_PORT;

  if (debug || process.env.SPOTLIGHT_DEBUG) {
    enableDebugLogging(true);
  }

  if (customLogger) {
    activateLogger(customLogger);
  }

  if (port && !isValidPort(port)) {
    logger.info("Please provide a valid port.");
    process.exit(1);
  } else if (port) {
    sidecarPort = typeof port === "string" ? Number(port) : port;
  }

  if (await isSidecarRunning(sidecarPort)) {
    logger.info(`Sidecar is already running on port ${sidecarPort}`);
    const hasSpotlightUI = (filesToServe && "/src/index.html" in filesToServe) || (!filesToServe && basePath);
    if (hasSpotlightUI) {
      logSpotlightUrl(sidecarPort);
    }
    if (stdioMCP) {
      async function startMCPStdioHTTPProxy() {
        const server = await startStdioServer({
          // We need to hook into `initStreamClient` as the returned object from startStdioServer
          // is not a meta proxy object giving access to both the server and the client. It just
          // returns the StdioServerTransport instance without a way to access the client or its errors.
          // TODO: We should probably upstream a fix for this to close the server or bubble the errors
          initStreamClient: () => {
            const client = new Client({
              name: "Spotlight Sidecar (stdio proxy)",
              version: "1.0.0",
            });
            client.onerror = (err: Error) => {
              if (
                err.message.startsWith("Maximum reconnection attempts") ||
                /disconnected|fetch failed|connection closed/i.test(err.message)
              ) {
                client.close();
                server.close();

                // We need to manually resume stdin as `StdioServerTransport` pauses it on
                // close but does not `resume` it when a new instance is created. Probably
                // a bug in https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/server/stdio.ts
                process.stdin.resume();
              } else if (!/conflict/i.test(err.message)) {
                captureException(err);
                logger.error(`MCP stdio proxy error: ${err.name}: ${err.message}`);
              }
            };
            return Promise.resolve(client);
          },
          serverType: ProxyServerType.HTTPStream,
          url: `http://localhost:${sidecarPort}/mcp`,
        });
        server.onclose = async () => {
          logger.info("MCP stdio proxy server closed.");
          try {
            await startMCPStdioHTTPProxy();
          } catch (_err) {
            try {
              serverInstance = await startServer({
                port: sidecarPort,
                basePath,
                filesToServe,
                incomingPayload,
                stdioMCP,
              });
            } catch (_err2) {
              logger.error("Failed to restart sidecar server after MCP stdio proxy closed.");
              captureException(_err2);
              await startMCPStdioHTTPProxy();
            }
          }
        };
      }
      logger.info("Connecting to existing MCP instance with stdio proxy...");
      await startMCPStdioHTTPProxy();
    }
  } else if (!serverInstance) {
    serverInstance = await startServer({
      port: sidecarPort,
      basePath,
      filesToServe,
      incomingPayload,
      onEnvelope,
      stdioMCP,
    });
  }
}

export function clearBuffer(): void {
  getBuffer().reset();
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
    serverInstance.unref();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
