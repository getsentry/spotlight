import { z } from "zod";
import { logger } from "./logger.js";
import type { MessageBuffer } from "./messageBuffer.js";

type Payload = [string, Buffer];

// MCP SDK compatible result interface
export interface ToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  [key: string]: unknown; // Index signature for MCP SDK compatibility
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (args: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  buffer: MessageBuffer<Payload>;
}

// Error handling utility
function createErrorResult(message: string, details?: string): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: details ? `${message}\n\n${details}` : message,
      },
    ],
    isError: true,
  };
}

// Success result utility
function createSuccessResult(data: any): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

// Individual tool definitions
const getEventsToolDefinition: ToolDefinition = {
  name: "get-events",
  description: "Retrieve event information with optional filtering",
  inputSchema: z.object({
    contentType: z.string().optional().describe("Filter events by content type"),
    limit: z.number().optional().default(10).describe("Maximum number of events to return"),
  }),
  handler: async ({ contentType, limit = 10 }, { buffer }) => {
    try {
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

      return createSuccessResult(eventData);
    } catch (error) {
      logger.error(`Error in get-events tool: ${String(error)}`);
      return createErrorResult("Failed to retrieve events", String(error));
    }
  },
};

const getEventDetailsToolDefinition: ToolDefinition = {
  name: "get-event-details",
  description: "Get detailed information about a specific event",
  inputSchema: z.object({
    eventIndex: z.number().describe("Index of the event to retrieve"),
  }),
  handler: async ({ eventIndex }, { buffer }) => {
    try {
      const allEvents = buffer.getAll();

      if (eventIndex < 0 || eventIndex >= allEvents.length) {
        return createErrorResult("Event index out of range", `Available range: 0-${allEvents.length - 1}`);
      }

      const [contentType, data] = allEvents[eventIndex];
      const eventDetails = {
        id: eventIndex,
        contentType,
        timestamp: new Date().toISOString(),
        size: data.length,
        data: data.toString("utf-8"),
      };

      return createSuccessResult(eventDetails);
    } catch (error) {
      logger.error(`Error in get-event-details tool: ${String(error)}`);
      return createErrorResult("Failed to retrieve event details", String(error));
    }
  },
};

const getEventStatsToolDefinition: ToolDefinition = {
  name: "get-event-stats",
  description: "Get statistics about stored events",
  inputSchema: z.object({}),
  handler: async (_, { buffer }) => {
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

      return createSuccessResult(stats);
    } catch (error) {
      logger.error(`Error in get-event-stats tool: ${String(error)}`);
      return createErrorResult("Failed to retrieve event statistics", String(error));
    }
  },
};

const clearEventsToolDefinition: ToolDefinition = {
  name: "clear-events",
  description: "Clear all stored events",
  inputSchema: z.object({}),
  handler: async (_, { buffer }) => {
    try {
      const eventCount = buffer.getAll().length;
      buffer.clear();

      const result = {
        message: "Events cleared successfully",
        clearedCount: eventCount,
      };

      return createSuccessResult(result);
    } catch (error) {
      logger.error(`Error in clear-events tool: ${String(error)}`);
      return createErrorResult("Failed to clear events", String(error));
    }
  },
};

const searchEventsToolDefinition: ToolDefinition = {
  name: "search-events",
  description: "Search events by content using a text query",
  inputSchema: z.object({
    query: z.string().describe("Text to search for in event content"),
    caseSensitive: z.boolean().optional().default(false).describe("Whether search should be case sensitive"),
    limit: z.number().optional().default(10).describe("Maximum number of results to return"),
  }),
  handler: async ({ query, caseSensitive = false, limit = 10 }, { buffer }) => {
    try {
      const allEvents = buffer.getAll();
      const searchQuery = caseSensitive ? query : query.toLowerCase();

      const matchingEvents = allEvents
        .map(([contentType, data]: [string, Buffer], index: number) => {
          const content = data.toString("utf-8");
          const searchContent = caseSensitive ? content : content.toLowerCase();

          if (searchContent.includes(searchQuery)) {
            return {
              id: index,
              contentType,
              timestamp: new Date().toISOString(),
              size: data.length,
              preview: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
              matchCount: (
                searchContent.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []
              ).length,
            };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, limit);

      const result = {
        query,
        totalMatches: matchingEvents.length,
        events: matchingEvents,
      };

      return createSuccessResult(result);
    } catch (error) {
      logger.error(`Error in search-events tool: ${String(error)}`);
      return createErrorResult("Failed to search events", String(error));
    }
  },
};

const getEventsByTimeToolDefinition: ToolDefinition = {
  name: "get-events-by-time",
  description: "Get events within a specific time range (last N minutes)",
  inputSchema: z.object({
    minutes: z.number().min(1).describe("Number of minutes to look back"),
    contentType: z.string().optional().describe("Filter by content type"),
  }),
  handler: async ({ minutes, contentType }, { buffer }) => {
    try {
      // Note: This is a simplified implementation since we don't store actual timestamps
      // In a real implementation, you'd want to store timestamps with events
      const allEvents = buffer.getAll();
      let events = allEvents;

      if (contentType) {
        events = events.filter(([type]: [string, Buffer]) => type === contentType);
      }

      // For now, just return recent events (this would be improved with real timestamps)
      const eventData = events.map(([type, data]: [string, Buffer], index: number) => ({
        id: index,
        contentType: type,
        timestamp: new Date().toISOString(),
        size: data.length,
        preview: data.toString("utf-8").substring(0, 200) + (data.length > 200 ? "..." : ""),
        note: `Simulated time range: last ${minutes} minutes`,
      }));

      const result = {
        timeRange: `Last ${minutes} minutes`,
        totalEvents: eventData.length,
        events: eventData,
      };

      return createSuccessResult(result);
    } catch (error) {
      logger.error(`Error in get-events-by-time tool: ${String(error)}`);
      return createErrorResult("Failed to retrieve events by time", String(error));
    }
  },
};

// Registry of all available tools
const toolDefinitions: ToolDefinition[] = [
  getEventsToolDefinition,
  getEventDetailsToolDefinition,
  getEventStatsToolDefinition,
  clearEventsToolDefinition,
  searchEventsToolDefinition,
  getEventsByTimeToolDefinition,
];

// Factory function to create tools with context
export function createMcpTools(buffer: MessageBuffer<Payload>) {
  const context: ToolContext = { buffer };

  return toolDefinitions.map(toolDef => ({
    name: toolDef.name,
    description: toolDef.description,
    inputSchema: toolDef.inputSchema,
    handler: async (args: any) => {
      logger.debug(`Executing MCP tool: ${toolDef.name}`);
      return await toolDef.handler(args, context);
    },
  }));
}

// Export tool definitions for easy extension
export { toolDefinitions };
