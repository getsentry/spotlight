import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./logger.js";
import type { MessageBuffer } from "./messageBuffer.js";

type Payload = [string, Buffer];

export interface McpServerInterface {
  server: Server;
  handleRequest: (request: any) => Promise<any>;
  close: () => void;
}

// Helper function to parse JSON from buffer
function parseJSONFromBuffer<T = unknown>(data: Uint8Array): T {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch {
    logger.warn("Failed to parse JSON from buffer");
    return {} as T;
  }
}

// Helper function to get line end position
function getLineEnd(buffer: Uint8Array): number {
  const newlineIndex = buffer.indexOf(10); // '\n' character
  return newlineIndex === -1 ? buffer.length : newlineIndex;
}

// Parse Sentry envelope format
function parseSentryEnvelope(data: Buffer) {
  let buffer = new Uint8Array(data);

  function readLine(length?: number) {
    const cursor = length ?? getLineEnd(buffer);
    const line = buffer.subarray(0, cursor);
    buffer = buffer.subarray(cursor + 1);
    return line;
  }

  const envelopeHeader = parseJSONFromBuffer(readLine()) as any;
  const items: any[] = [];

  while (buffer.length) {
    const itemHeader = parseJSONFromBuffer(readLine()) as any;
    const payloadLength = itemHeader.length;
    const itemPayloadRaw = readLine(payloadLength);

    let itemPayload: any;
    try {
      itemPayload = parseJSONFromBuffer(itemPayloadRaw);
      if (itemHeader.type) {
        itemPayload.type = itemHeader.type;
      }
    } catch {
      itemPayload = new TextDecoder().decode(itemPayloadRaw);
    }

    items.push([itemHeader, itemPayload]);
  }

  return {
    header: envelopeHeader,
    items: items,
  };
}

// Generate comprehensive event summary
function generateEventSummary(envelope: any) {
  const { header, items } = envelope;
  const summary: any = {
    envelopeInfo: {
      sentAt: header.sent_at,
      sdk: header.sdk,
      traceId: header.trace?.trace_id,
      environment: header.trace?.environment,
      release: header.trace?.release,
    },
    items: [],
    stats: {
      totalItems: items.length,
      itemTypes: {},
      hasTraces: false,
      hasErrors: false,
      hasTransactions: false,
      spanCount: 0,
    },
  };

  for (const [itemHeader, itemPayload] of items) {
    const itemType = itemHeader.type;
    summary.stats.itemTypes[itemType] = (summary.stats.itemTypes[itemType] || 0) + 1;

    const itemSummary: any = {
      type: itemType,
      header: itemHeader,
    };

    // Extract detailed information based on item type
    if (itemType === "transaction") {
      summary.stats.hasTransactions = true;
      summary.stats.hasTraces = true;
      itemSummary.transaction = {
        name: itemPayload.transaction,
        op: itemPayload.contexts?.trace?.op,
        status: itemPayload.contexts?.trace?.status,
        startTimestamp: itemPayload.start_timestamp,
        timestamp: itemPayload.timestamp,
        duration: itemPayload.timestamp - itemPayload.start_timestamp,
        platform: itemPayload.platform,
        environment: itemPayload.environment,
        release: itemPayload.release,
        spans: itemPayload.spans?.length || 0,
        tags: itemPayload.tags,
        measurements: itemPayload.measurements,
        request: itemPayload.request,
      };

      if (itemPayload.spans) {
        summary.stats.spanCount += itemPayload.spans.length;
        itemSummary.spans = itemPayload.spans.map((span: any) => ({
          span_id: span.span_id,
          parent_span_id: span.parent_span_id,
          op: span.op,
          description: span.description,
          start_timestamp: span.start_timestamp,
          timestamp: span.timestamp,
          duration: span.timestamp - span.start_timestamp,
          status: span.status,
          tags: span.tags,
          data: span.data,
        }));
      }
    } else if (itemType === "event" || itemType === "error") {
      summary.stats.hasErrors = true;
      itemSummary.event = {
        eventId: itemPayload.event_id,
        level: itemPayload.level,
        message: itemPayload.message,
        platform: itemPayload.platform,
        environment: itemPayload.environment,
        release: itemPayload.release,
        timestamp: itemPayload.timestamp,
        exception: itemPayload.exception,
        breadcrumbs: itemPayload.breadcrumbs?.length || 0,
        tags: itemPayload.tags,
        contexts: itemPayload.contexts,
        request: itemPayload.request,
        user: itemPayload.user,
        extra: itemPayload.extra,
      };

      if (itemPayload.breadcrumbs) {
        itemSummary.breadcrumbs = itemPayload.breadcrumbs.slice(0, 5).map((crumb: any) => ({
          timestamp: crumb.timestamp,
          category: crumb.category,
          message: crumb.message,
          level: crumb.level,
          type: crumb.type,
        }));
      }
    } else if (itemType === "profile") {
      itemSummary.profile = {
        platform: itemPayload.platform,
        device: itemPayload.device,
        os: itemPayload.os,
        runtime: itemPayload.runtime,
        version: itemPayload.version,
        samples: itemPayload.profile?.samples?.length || 0,
        frames: itemPayload.profile?.frames?.length || 0,
        stacks: itemPayload.profile?.stacks?.length || 0,
        transactions: itemPayload.transactions?.length || 0,
      };
    }

    summary.items.push(itemSummary);
  }

  return summary;
}

export function createMcpServer(buffer: MessageBuffer<Payload>): McpServerInterface {
  const server = new Server(
    {
      name: "Spotlight Sidecar MCP",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // Store handler functions locally for direct access
  const listToolsHandler = async () => {
    return {
      tools: [
        {
          name: "get-events",
          description: "Get event information from the Spotlight sidecar",
          inputSchema: {
            type: "object",
            properties: {
              contentType: {
                type: "string",
                description: "Filter events by content type",
              },
              limit: {
                type: "number",
                description: "Maximum number of events to return",
                default: 10,
              },
            },
          },
        },
        {
          name: "get-event-details",
          description: "Get detailed data for a specific event by index with comprehensive Sentry envelope parsing",
          inputSchema: {
            type: "object",
            properties: {
              eventIndex: {
                type: "number",
                description: "Index of the event to retrieve",
              },
            },
            required: ["eventIndex"],
          },
        },
        {
          name: "get-event-stats",
          description: "Get statistics about all events in the buffer",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "clear-events",
          description: "Clear all events from the buffer",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  };

  const callToolHandler = async (request: any) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get-events": {
        const allEvents = buffer.getAll();
        let events = allEvents;
        const contentType = args?.contentType;
        const limit = args?.limit || 10;

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
      }

      case "get-event-details": {
        const eventIndex = args?.eventIndex;
        if (typeof eventIndex !== "number") {
          throw new Error("eventIndex is required and must be a number");
        }

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

        // Parse Sentry envelope if it's a Sentry event
        if (contentType === "application/x-sentry-envelope") {
          try {
            const parsedEnvelope = parseSentryEnvelope(data);
            const summary = generateEventSummary(parsedEnvelope);

            const eventDetails = {
              id: eventIndex,
              contentType,
              timestamp: new Date().toISOString(),
              size: data.length,
              summary: summary,
              envelope: {
                header: parsedEnvelope.header,
                items: parsedEnvelope.items,
              },
              debugging: {
                traceId: parsedEnvelope.header.trace?.trace_id,
                spans: summary.stats.spanCount,
                errors: summary.stats.hasErrors,
                transactions: summary.stats.hasTransactions,
                breadcrumbCount: summary.items.reduce(
                  (acc: number, item: any) => acc + (item.breadcrumbs?.length || 0),
                  0,
                ),
                platforms: [
                  ...new Set(
                    summary.items
                      .map((item: any) => item.event?.platform || item.transaction?.platform)
                      .filter(Boolean),
                  ),
                ],
                environments: [
                  ...new Set(
                    summary.items
                      .map((item: any) => item.event?.environment || item.transaction?.environment)
                      .filter(Boolean),
                  ),
                ],
              },
            };

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(eventDetails, null, 2),
                },
              ],
            };
          } catch (error) {
            // Fall back to raw data if parsing fails
            logger.warn(`Failed to parse Sentry envelope: ${error}`);
          }
        }

        // Fallback for non-Sentry events or parsing failures
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
      }

      case "get-event-stats": {
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
      }

      case "clear-events": {
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
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };

  const listResourcesHandler = async () => {
    return {
      resources: [
        {
          uri: "spotlight://events/all",
          name: "All Events",
          description: "All current events in the buffer",
          mimeType: "application/json",
        },
      ],
    };
  };

  const readResourceHandler = async (request: any) => {
    const { uri } = request.params;

    if (uri === "spotlight://events/all") {
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
            uri,
            text: JSON.stringify(eventData, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  };

  const listPromptsHandler = async () => {
    return {
      prompts: [
        {
          name: "analyze-events",
          description: "Analyze Spotlight events with different types of analysis",
          arguments: [
            {
              name: "contentType",
              description: "Filter by content type",
              required: false,
            },
            {
              name: "analysisType",
              description: "Type of analysis to perform",
              required: false,
            },
          ],
        },
      ],
    };
  };

  const getPromptHandler = async (request: any) => {
    const { name, arguments: args } = request.params;

    if (name === "analyze-events") {
      const contentType = args?.contentType;
      const analysisType = args?.analysisType || "summary";
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
        default:
          promptText = `Please analyze the Spotlight events${contentType ? ` of type "${contentType}"` : ""} and provide a summary of the activity.`;
      }

      return {
        description: "Analyze Spotlight events",
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
    }

    throw new Error(`Unknown prompt: ${name}`);
  };

  // Set up the request handlers (even though we'll call them directly)
  server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);
  server.setRequestHandler(CallToolRequestSchema, callToolHandler);
  server.setRequestHandler(ListResourcesRequestSchema, listResourcesHandler);
  server.setRequestHandler(ReadResourceRequestSchema, readResourceHandler);
  server.setRequestHandler(ListPromptsRequestSchema, listPromptsHandler);
  server.setRequestHandler(GetPromptRequestSchema, getPromptHandler);

  logger.info("MCP server created with event analysis capabilities");

  return {
    server,
    handleRequest: async (request: any) => {
      logger.debug(`MCP request received: ${JSON.stringify(request)}`);

      try {
        // Handle MCP protocol methods manually
        switch (request.method) {
          case "initialize":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                protocolVersion: "2024-11-05",
                capabilities: {
                  tools: {},
                  resources: {},
                  prompts: {},
                },
                serverInfo: {
                  name: "Spotlight Sidecar MCP",
                  version: "1.0.0",
                },
              },
            };

          case "initialized":
            // Just acknowledge the initialized notification
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {},
            };

          case "tools/list": {
            const toolsResult = await listToolsHandler();
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: toolsResult,
            };
          }

          case "tools/call": {
            const callResult = await callToolHandler(request);
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: callResult,
            };
          }

          case "resources/list": {
            const resourcesResult = await listResourcesHandler();
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: resourcesResult,
            };
          }

          case "resources/read": {
            const readResult = await readResourceHandler(request);
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: readResult,
            };
          }

          case "prompts/list": {
            const promptsResult = await listPromptsHandler();
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: promptsResult,
            };
          }

          case "prompts/get": {
            const promptResult = await getPromptHandler(request);
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: promptResult,
            };
          }

          default:
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32601,
                message: `Method not found: ${request.method}`,
              },
            };
        }
      } catch (error) {
        logger.error(`MCP request failed: ${error}`);
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: "Internal error",
            data: String(error),
          },
        };
      }
    },
    close: () => {
      logger.info("MCP server closed");
    },
  };
}
