import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { z } from "zod";
import { logger } from "./logger.js";
import { createMcpTools } from "./mcp-tools.js";
import type { MessageBuffer } from "./messageBuffer.js";

type Payload = [string, Buffer];

export interface McpServerInterface {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  handleRequest: (req: IncomingMessage, res: ServerResponse, body?: any) => Promise<void>;
  close: () => void;
}

export function createMcpServer(buffer: MessageBuffer<Payload>): McpServerInterface {
  const server = new McpServer({
    name: "Spotlight Sidecar MCP",
    version: "1.0.0",
  });

  // Get all available tools from the tools module
  const tools = createMcpTools(buffer);

  // Resource to get all current events
  server.resource("events", "spotlight://events/all", async uri => {
    const allEvents = buffer.getAll();
    const eventData = allEvents.map(([contentType, data]: [string, Buffer], index: number) => ({
      id: index,
      contentType,
      timestamp: new Date().toISOString(),
      size: data.length,
      preview: data.toString("utf-8").substring(0, 200) + (data.length > 200 ? "..." : ""),
    }));

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(eventData, null, 2),
        },
      ],
    };
  });

  // Resource to get events by content type using ResourceTemplate
  server.resource("events-by-type", "spotlight://events/type/{contentType}", async uri => {
    // Extract contentType from URI path
    const urlPath = new URL(uri.href).pathname;
    const contentType = urlPath.split("/").pop();

    if (!contentType) {
      throw new Error("Content type not specified in URI");
    }

    const allEvents = buffer.getAll();
    const filteredEvents = allEvents
      .filter(([type]: [string, Buffer]) => type === contentType)
      .map(([type, data]: [string, Buffer], index: number) => ({
        id: index,
        contentType: type,
        timestamp: new Date().toISOString(),
        size: data.length,
        data: data.toString("utf-8"),
      }));

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(filteredEvents, null, 2),
        },
      ],
    };
  });

  // Register all tools from the tools module using the proper MCP API
  for (const tool of tools) {
    // Extract the shape from the Zod object schema for MCP SDK compatibility
    const schema = tool.inputSchema as z.ZodObject<any>;
    server.tool(tool.name, tool.description, schema.shape, async (args: any) => {
      const result = await tool.handler(args);
      return result;
    });
  }

  // Note: Prompts can be added later once the core functionality is working

  // Create StreamableHTTPServerTransport for HTTP integration
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode for simplicity
  });

  // Connect the server to the transport immediately
  let isConnected = false;
  const connectPromise = server
    .connect(transport)
    .then(() => {
      isConnected = true;
      logger.info(`MCP server connected with ${tools.length} tools and event analysis capabilities`);
    })
    .catch(error => {
      logger.error(`Failed to connect MCP server: ${error}`);
    });

  return {
    server,
    transport,
    handleRequest: async (req: IncomingMessage, res: ServerResponse, body?: any) => {
      try {
        // Wait for the server to be connected
        if (!isConnected) {
          await connectPromise;
        }

        // Handle the request using the proper MCP transport
        await transport.handleRequest(req, res, body);
      } catch (error) {
        logger.error(`MCP request handling error: ${error}`);

        if (!res.headersSent) {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: "Internal server error",
              },
              id: null,
            }),
          );
        }
      }
    },
    close: () => {
      transport.close();
      logger.info("MCP server closed");
    },
  };
}
