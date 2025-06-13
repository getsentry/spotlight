import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "./logger.js";
import { createMcpTools, executeMcpTool } from "./mcp-tools.js";
import type { MessageBuffer } from "./messageBuffer.js";

type Payload = [string, Buffer];

export interface McpServerInterface {
  server: McpServer;
  handleRequest: (request: any) => Promise<any>;
  close: () => void;
}

export function createMcpServer(buffer: MessageBuffer<Payload>): McpServerInterface {
  const server = new McpServer({
    name: "Spotlight Sidecar MCP",
    version: "1.0.0",
  });

  // Get all available tools
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
  server.resource(
    "events-by-type",
    new ResourceTemplate("spotlight://events/type/{contentType}", { list: undefined }),
    async (uri, params) => {
      const { contentType } = params as { contentType: string };
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
    },
  );

  // Register all tools from the tools module
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.inputSchema, async args => {
      const result = await tool.handler(args);
      return result;
    });
  }

  // Prompt for analyzing events
  server.prompt(
    "analyze-events",
    {
      contentType: z.string().optional().describe("Filter by content type"),
      analysisType: z.enum(["summary", "errors", "performance"]).optional().describe("Type of analysis to perform"),
    },
    (args, _extra) => {
      const { contentType, analysisType = "summary" } = args;
      let promptText = "";

      switch (analysisType) {
        case "summary":
          promptText = `Please analyze the Spotlight events${contentType ? ` of type "${contentType}"` : ""} and provide a summary of the activity, including patterns, frequency, and any notable observations.`;
          break;
        case "errors":
          promptText = `Please analyze the Spotlight events${contentType ? ` of type "${contentType}"` : ""} and identify any errors, issues, or anomalies that require attention.`;
          break;
        case "performance":
          promptText = `Please analyze the Spotlight events${contentType ? ` of type "${contentType}"` : ""} and provide insights about performance patterns, bottlenecks, or optimization opportunities.`;
          break;
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: promptText,
            },
          },
        ],
      };
    },
  );

  logger.info(`MCP server created with ${tools.length} tools and event analysis capabilities`);

  return {
    server,
    handleRequest: async (request: any) => {
      // Simplified JSON-RPC handler for MCP protocol
      logger.debug(`MCP request received: ${JSON.stringify(request)}`);

      if (request.method === "tools/call") {
        const toolName = request.params?.name;
        const args = request.params?.arguments || {};

        // Use the centralized tool execution function
        const result = await executeMcpTool(tools, toolName, args);

        // Add the request ID to the response
        if (result.jsonrpc) {
          result.id = request.id;
        }

        return result;
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32601,
          message: "Method not found",
        },
      };
    },
    close: () => {
      logger.info("MCP server closed");
    },
  };
}
