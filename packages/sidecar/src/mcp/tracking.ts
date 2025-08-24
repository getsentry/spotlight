import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { generateUuidv4 } from "../messageBuffer.js";
import { getCurrentClientOrDefault } from "../services/McpRequestContext.js";
import { SIDECAR_MCP_BUFFER_SIZE, SIDECAR_MCP_INTERACTION_TYPES, type SidecarMcpInteractionType } from "./constants.js";
import type { SidecarMcpInteraction } from "./types.js";

export class SidecarMcpBuffer {
  private interactions: SidecarMcpInteraction[] = [];
  private maxSize = SIDECAR_MCP_BUFFER_SIZE;
  private subscribers = new Map<string, (interaction: SidecarMcpInteraction) => void>();

  push(interaction: SidecarMcpInteraction): void {
    this.interactions.push(interaction);

    // Maintain max size
    if (this.interactions.length > this.maxSize) {
      this.interactions.shift();
    }

    // Notify all subscribers
    for (const callback of this.subscribers.values()) {
      callback(interaction);
    }
  }

  subscribe(callback: (interaction: SidecarMcpInteraction) => void): string {
    const id = generateUuidv4();
    this.subscribers.set(id, callback);

    setTimeout(() => {
      for (const interaction of this.interactions) {
        callback(interaction);
      }
    });

    return id;
  }

  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  clear(): void {
    this.interactions = [];
    this.subscribers.clear();
  }
}

// Global buffer instance
const sidecarMcpBuffer = new SidecarMcpBuffer();

export function getSidecarMcpBuffer(): SidecarMcpBuffer {
  return sidecarMcpBuffer;
}

// Core tracking function
export function trackSidecarMcpInteraction(
  method: SidecarMcpInteractionType,
  tool: string | undefined,
  input: Record<string, unknown>,
  output: Record<string, unknown> | null,
  duration: number | undefined,
  client: string,
  success: boolean,
  error?: string,
  metadata?: Record<string, unknown>,
): void {
  const interaction: SidecarMcpInteraction = {
    id: generateUuidv4(),
    method,
    tool,
    input,
    output,
    duration,
    client,
    timestamp: new Date().toISOString(),
    success,
    error,
    metadata,
  };

  sidecarMcpBuffer.push(interaction);
}

export function trackConnectionOpen(client?: string, metadata?: Record<string, unknown>): void {
  const clientInfo = client
    ? { name: client, transport: "http" as const, userAgent: undefined }
    : getCurrentClientOrDefault();

  trackSidecarMcpInteraction(
    SIDECAR_MCP_INTERACTION_TYPES.CONNECTION_OPEN,
    undefined,
    { client: clientInfo.name },
    { status: "connected" },
    undefined,
    clientInfo.name,
    true,
    undefined,
    {
      ...metadata,
      transport: clientInfo.transport,
      userAgent: clientInfo.userAgent,
    },
  );
}

export function trackConnectionClose(client?: string, reason?: string, metadata?: Record<string, unknown>): void {
  const clientInfo = client
    ? { name: client, transport: "http" as const, userAgent: undefined }
    : getCurrentClientOrDefault();

  trackSidecarMcpInteraction(
    SIDECAR_MCP_INTERACTION_TYPES.CONNECTION_CLOSE,
    undefined,
    { client: clientInfo.name },
    { status: "disconnected", reason },
    undefined,
    clientInfo.name,
    true,
    undefined,
    {
      ...metadata,
      transport: clientInfo.transport,
      userAgent: clientInfo.userAgent,
    },
  );
}

export function trackConnectionError(client?: string, error?: string, metadata?: Record<string, unknown>): void {
  const clientInfo = client
    ? { name: client, transport: "http" as const, userAgent: undefined }
    : getCurrentClientOrDefault();
  const errorMessage = error || "Unknown connection error";

  trackSidecarMcpInteraction(
    SIDECAR_MCP_INTERACTION_TYPES.CONNECTION_ERROR,
    undefined,
    { client: clientInfo.name },
    { status: "error" },
    undefined,
    clientInfo.name,
    false,
    errorMessage,
    {
      ...metadata,
      transport: clientInfo.transport,
      userAgent: clientInfo.userAgent,
    },
  );
}

export function trackMcpRequest(client?: string, requestType?: string, metadata?: Record<string, unknown>): void {
  const clientInfo = client
    ? { name: client, transport: "http" as const, userAgent: undefined }
    : getCurrentClientOrDefault();
  const reqType = requestType || "unknown_request";

  trackSidecarMcpInteraction(
    SIDECAR_MCP_INTERACTION_TYPES.REQUEST,
    undefined,
    { client: clientInfo.name, requestType: reqType },
    { status: "requested" },
    undefined,
    clientInfo.name,
    true,
    undefined,
    {
      ...metadata,
      transport: clientInfo.transport,
      userAgent: clientInfo.userAgent,
    },
  );
}

export function trackMcpResponse(
  client?: string,
  responseType?: string,
  success = true,
  metadata?: Record<string, unknown>,
): void {
  const clientInfo = client
    ? { name: client, transport: "http" as const, userAgent: undefined }
    : getCurrentClientOrDefault();
  const respType = responseType || "unknown_response";

  trackSidecarMcpInteraction(
    SIDECAR_MCP_INTERACTION_TYPES.RESPONSE,
    undefined,
    { client: clientInfo.name, responseType: respType },
    { status: success ? "success" : "failed" },
    undefined,
    clientInfo.name,
    success,
    undefined,
    {
      ...metadata,
      transport: clientInfo.transport,
      userAgent: clientInfo.userAgent,
    },
  );
}

export function wrapMcpServerWithTracking(mcpServer: McpServer): McpServer {
  const originalRegisterTool = mcpServer.registerTool.bind(mcpServer);

  mcpServer.registerTool = <InputArgs extends z.ZodRawShape, OutputArgs extends z.ZodRawShape>(
    name: string,
    config: {
      title?: string;
      description?: string;
      inputSchema?: InputArgs;
      outputSchema?: OutputArgs;
      annotations?: Record<string, unknown>;
    },
    cb: ToolCallback<InputArgs>,
  ) => {
    const wrappedHandler = async (
      args: z.objectOutputType<InputArgs, z.ZodTypeAny>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ) => {
      const startTime = Date.now();
      const requestId = generateUuidv4();

      const clientInfo = getCurrentClientOrDefault();

      try {
        // Track request start
        trackMcpRequest(undefined, `tool_call:${name}`, {
          toolName: name,
          requestId,
          timestamp: new Date().toISOString(),
          status: "started",
        });

        // Execute the actual tool callback
        const result = await cb(args, extra);
        const duration = Date.now() - startTime;

        // Track successful completion
        trackSidecarMcpInteraction(
          SIDECAR_MCP_INTERACTION_TYPES.TOOL_CALL_SUCCESS,
          name,
          args || {},
          result || {},
          duration,
          clientInfo.name,
          true,
          undefined,
          {
            toolName: name,
            requestId,
            status: "completed",
            transport: clientInfo.transport,
            userAgent: clientInfo.userAgent || "unknown",
          },
        );

        trackMcpResponse(undefined, `tool_call:${name}`, true, {
          toolName: name,
          duration,
          requestId,
          timestamp: new Date().toISOString(),
          status: "completed",
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = sanitizeErrorMessage(error);

        // Track error
        trackSidecarMcpInteraction(
          SIDECAR_MCP_INTERACTION_TYPES.TOOL_CALL_ERROR,
          name,
          args || {},
          null,
          duration,
          clientInfo.name,
          false,
          errorMessage,
          {
            toolName: name,
            requestId,
            status: "failed",
            transport: clientInfo.transport,
            userAgent: clientInfo.userAgent || "unknown",
            errorType: error instanceof Error ? error.constructor.name : "UnknownError",
          },
        );

        trackMcpResponse(undefined, `tool_call:${name}`, false, {
          toolName: name,
          duration,
          error: errorMessage,
          requestId,
          timestamp: new Date().toISOString(),
          status: "failed",
        });

        throw error;
      }
    };

    return originalRegisterTool(name, config, wrappedHandler as ToolCallback<InputArgs>);
  };

  // Track server lifecycle events
  const originalConnect = mcpServer.connect?.bind(mcpServer);
  if (originalConnect && typeof originalConnect === "function") {
    mcpServer.connect = async transport => {
      try {
        trackConnectionOpen(undefined, {
          transport: "http",
          timestamp: new Date().toISOString(),
        });

        return await originalConnect(transport);
      } catch (error) {
        const errorMessage = sanitizeErrorMessage(error);
        trackConnectionError(undefined, errorMessage, {
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    };
  }

  return mcpServer;
}

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
