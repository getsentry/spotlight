import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { captureException } from "@sentry/node";
import { ServerType as ProxyServerType, startStdioServer } from "mcp-proxy";
import { setShutdownHandlers, startServer } from "~/main.js";
import { createMCPInstance } from "~/mcp/mcp.js";
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
  try {
    await createMCPInstance().connect(new StdioServerTransport());
  } catch (err) {
    logger.error(`Failed to connect MCP over stdio: ${(err as Error).message}`);
    throw err;
  }
  return serverInstance;
}

async function startMCPStdioHTTPProxy(
  port: CLIHandlerOptions["port"],
  basePath: CLIHandlerOptions["basePath"],
  filesToServe: CLIHandlerOptions["filesToServe"],
) {
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
    url: `http://localhost:${port}/mcp`,
  });
  server.onclose = async () => {
    logger.info("MCP stdio proxy server closed.");
    try {
      await startMCPStdioHTTPProxy(port, basePath, filesToServe);
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
  } else {
    return await startServerWithStdioMCP(port, basePath, filesToServe);
  }
}
