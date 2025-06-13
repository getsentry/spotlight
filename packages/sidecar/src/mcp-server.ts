import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "./logger.js";
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

  // Tool to get event information
  server.tool(
    "get-events",
    {
      contentType: z.string().optional().describe("Filter events by content type"),
      limit: z.number().optional().default(10).describe("Maximum number of events to return"),
    },
    async ({ contentType, limit }) => {
      const allEvents = buffer.getAll();
      let events = allEvents;

      if (contentType) {
        events = events.filter(([type]: [string, Buffer]) => type === contentType);
      }

      const limitedEvents = events.slice(-limit);
      const eventData = limitedEvents.map(([type, data]: [string, Buffer], index: number) => ({
        id: index,
        contentType: type,
        timestamp: new Date().toISOString(),
        size: data.length,
        preview: data.toString("utf-8").substring(0, 200) + (data.length > 200 ? "..." : ""),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(eventData, null, 2),
          },
        ],
      };
    },
  );

  // Tool to get detailed event data
  server.tool(
    "get-event-details",
    {
      eventIndex: z.number().describe("Index of the event to retrieve"),
    },
    async ({ eventIndex }) => {
      const allEvents = buffer.getAll();

      if (eventIndex < 0 || eventIndex >= allEvents.length) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Event index out of range",
                  availableRange: `0-${allEvents.length - 1}`,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const [contentType, data] = allEvents[eventIndex];
      const eventDetails = {
        id: eventIndex,
        contentType,
        timestamp: new Date().toISOString(),
        size: data.length,
        data: data.toString("utf-8"),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(eventDetails, null, 2),
          },
        ],
      };
    },
  );

  // Tool to get event statistics
  server.tool("get-event-stats", {}, async () => {
    const allEvents = buffer.getAll();
    const stats = {
      totalEvents: allEvents.length,
      eventsByType: {} as Record<string, number>,
      totalSize: 0,
    };

    for (const [contentType, data] of allEvents) {
      stats.eventsByType[contentType] = (stats.eventsByType[contentType] || 0) + 1;
      stats.totalSize += data.length;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  });

  // Tool to clear events
  server.tool("clear-events", {}, async () => {
    const eventCount = buffer.getAll().length;
    buffer.clear();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              message: "Events cleared successfully",
              clearedCount: eventCount,
            },
            null,
            2,
          ),
        },
      ],
    };
  });

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

  logger.info("MCP server created with event analysis capabilities");

  return {
    server,
    handleRequest: async (request: any) => {
      // Simplified JSON-RPC handler for MCP protocol
      logger.debug(`MCP request received: ${JSON.stringify(request)}`);

      if (request.method === "tools/call") {
        const toolName = request.params?.name;
        const args = request.params?.arguments || {};

        // Handle get-events tool
        if (toolName === "get-events") {
          try {
            const allEvents = buffer.getAll();
            let events = allEvents;
            const contentType = args.contentType;
            const limit = args.limit || 10;

            if (contentType) {
              events = events.filter(([type]: [string, Buffer]) => type === contentType);
            }

            const limitedEvents = events.slice(-limit);
            const eventData = limitedEvents.map(([type, data]: [string, Buffer], index: number) => ({
              id: index,
              contentType: type,
              timestamp: new Date().toISOString(),
              size: data.length,
              preview: data.toString("utf-8").substring(0, 200) + (data.length > 200 ? "..." : ""),
            }));

            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(eventData, null, 2),
                  },
                ],
              },
            };
          } catch (error) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32603,
                message: "Tool execution failed",
                data: String(error),
              },
            };
          }
        }

        // Handle get-event-stats tool
        if (toolName === "get-event-stats") {
          try {
            const allEvents = buffer.getAll();
            const stats = {
              totalEvents: allEvents.length,
              eventsByType: {} as Record<string, number>,
              totalSize: 0,
            };

            for (const [contentType, data] of allEvents) {
              stats.eventsByType[contentType] = (stats.eventsByType[contentType] || 0) + 1;
              stats.totalSize += data.length;
            }

            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(stats, null, 2),
                  },
                ],
              },
            };
          } catch (error) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32603,
                message: "Tool execution failed",
                data: String(error),
              },
            };
          }
        }

        // Handle clear-events tool
        if (toolName === "clear-events") {
          try {
            const eventCount = buffer.getAll().length;
            buffer.clear();

            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        message: "Events cleared successfully",
                        clearedCount: eventCount,
                      },
                      null,
                      2,
                    ),
                  },
                ],
              },
            };
          } catch (error) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32603,
                message: "Tool execution failed",
                data: String(error),
              },
            };
          }
        }

        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Tool not found: ${toolName}`,
          },
        };
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
