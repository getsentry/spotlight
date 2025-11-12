import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { captureException } from "@sentry/node";
import { ServerType as ProxyServerType, startStdioServer } from "mcp-proxy";
import { setShutdownHandlers, startServer } from "@spotlight/server/main.js";
import { createMCPInstance } from "@spotlight/server/mcp/mcp.js";
import { logger } from "../logger.js";
import type { CLIHandlerOptions } from "../types/cli.js";
import { isSidecarRunning } from "../utils/extras.js";

async function startServerWithStdioMCP(
  port: CLIHandlerOptions["port"],
  basePath: CLIHandlerOptions["basePath"],
  filesToServe: CLIHandlerOptions["filesToServe"],
) {
  const serverInstance = await startServer({
    port,
    basePath,
    filesToServe,
  });
  setShutdownHandlers(serverInstance);

  logger.info("Starting MCP over stdio too...");
  const mcpInstance = createMCPInstance();
  await mcpInstance.connect(new StdioServerTransport());

  const shutdownMcp = () => {
    mcpInstance.close();
  };

  process.on("SIGINT", shutdownMcp);
  process.on("SIGTERM", shutdownMcp);

  return serverInstance;
}

async function startMCPStdioHTTPProxy(
  port: CLIHandlerOptions["port"],
  basePath: CLIHandlerOptions["basePath"],
  filesToServe: CLIHandlerOptions["filesToServe"],
) {
  let intentionalShutdown = false;
  let client: Client | null = null;
  let server: Awaited<ReturnType<typeof startStdioServer>> | null = null;

  const shutdown = async () => {
    if (intentionalShutdown) {
      // If we get the signal again, exit immediately
      logger.info("Bye.");
      process.exit(0);
    }

    intentionalShutdown = true;
    logger.info("Shutting down MCP stdio proxy...");

    if (client) {
      await client.close();
    }
    if (server) {
      await server.close();
    }
  };

  // Set up signal handlers for graceful shutdown
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  server = await startStdioServer({
    // We need to hook into `initStreamClient` as the returned object from startStdioServer
    // is not a meta proxy object giving access to both the server and the client. It just
    // returns the StdioServerTransport instance without a way to access the client or its errors.
    // TODO: We should probably upstream a fix for this to close the server or bubble the errors
    initStreamClient: () => {
      client = new Client({
        name: "Spotlight Sidecar (stdio proxy)",
        version: "1.0.0",
      });
      client.onerror = async (err: Error) => {
        if (
          err.message.startsWith("Maximum reconnection attempts") ||
          /disconnected|fetch failed|connection closed/i.test(err.message)
        ) {
          if (client) await client.close();
          if (server) await server.close();
        } else if (!/conflict/i.test(err.message)) {
          captureException(err);
          logger.error(`MCP stdio proxy error: ${err.name}: ${err.message}`);
        }
      };
      return Promise.resolve(client);
    },
    serverType: ProxyServerType.HTTPStream,
    url: `http://localhost:${port}/mcp`,
  });
  server.onclose = async () => {
    // If this is an intentional shutdown, don't restart
    if (intentionalShutdown) {
      logger.info("MCP stdio proxy server closed.");
      return;
    }

    logger.info("MCP stdio proxy server closed unexpectedly. Attempting to restart...");
    process.off("SIGINT", shutdown);
    process.off("SIGTERM", shutdown);
    // We need to manually resume stdin as `StdioServerTransport` pauses it on
    // close but does not `resume` it when a new instance is created. Probably
    // a bug in https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/server/stdio.ts
    process.stdin.resume();

    try {
      await startMCPStdioHTTPProxy(port, basePath, filesToServe);
      logger.info("Connection restored");
    } catch (_err) {
      try {
        return await startServerWithStdioMCP(port, basePath, filesToServe);
      } catch (_err2) {
        logger.error("Failed to restart sidecar server after MCP stdio proxy closed.");
        captureException(_err2);
        await startMCPStdioHTTPProxy(port, basePath, filesToServe);
      }
    }
  };
}

export default async function mcp({ port, basePath, filesToServe }: CLIHandlerOptions) {
  if (port > 0 && (await isSidecarRunning(port))) {
    logger.info("Connecting to existing MCP instance with stdio proxy...");
    await startMCPStdioHTTPProxy(port, basePath, filesToServe);
    logger.info(`Connected to existing MCP instance on port ${port}`);
  } else {
    return await startServerWithStdioMCP(port, basePath, filesToServe);
  }
}
