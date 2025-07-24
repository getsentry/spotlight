import { randomUUID } from "node:crypto";
// MCP test server factory following TypeScript SDK patterns
import { IncomingMessage, type Server, ServerResponse, createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { mockErrorEvent, mockLogEvent, mockTrace } from "../__fixtures__/sentryEvents.js";
import { createSpotlightMcpServer } from "../mcpServer.js";

/**
 * Test server configuration for MCP server tests
 */
interface TestMcpServerConfig {
  sessionIdGenerator?: () => string;
  enableJsonResponse?: boolean;
}

/**
 * Helper to create and start test MCP server with HTTP transport
 * Following patterns from MCP TypeScript SDK streamableHttp.test.ts
 */
export async function createTestMcpServer(config: TestMcpServerConfig = {}): Promise<{
  server: Server;
  transport: StreamableHTTPServerTransport;
  baseUrl: URL;
  sessionId?: string;
}> {
  // Create simple test event processor with fixtures
  const testEventProcessor = {
    getEvents: () => [mockErrorEvent],
    getErrorEvents: () => [mockErrorEvent],
    getTransactionEvents: () => [],
    getTraces: () => [mockTrace],
    getEventById: (id: string) => (id === "error-1" ? mockErrorEvent : null),
    getTraceById: (id: string) => (id === "trace-1" ? mockTrace : null),
    getLogsByTraceId: (id: string) => (id === "trace-1" ? [mockLogEvent] : []),
    getLogs: () => [mockLogEvent],
    getProfiles: () => [],
    getSdks: () => [],
    resetData: () => {},
  };

  // Create MCP server with test event processor
  const mcpServer = createSpotlightMcpServer(testEventProcessor as any);

  // Create transport like SDK tests
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: config.sessionIdGenerator || (() => randomUUID()),
    enableJsonResponse: config.enableJsonResponse ?? false,
  });

  // Connect server to transport
  await mcpServer.connect(transport);

  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling request:", error);
      if (!res.headersSent) res.writeHead(500).end();
    }
  });

  // Start server and get URL
  const baseUrl = await new Promise<URL>(resolve => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as any;
      resolve(new URL(`http://127.0.0.1:${addr.port}`));
    });
  });

  return { server, transport, baseUrl };
}

/**
 * Helper to stop test MCP server
 */
export async function stopTestMcpServer({
  server,
  transport,
}: {
  server: Server;
  transport: StreamableHTTPServerTransport;
}): Promise<void> {
  await transport.close();
  server.close();
}

/**
 * Common test messages for MCP protocol
 */
export const MCP_TEST_MESSAGES = {
  initialize: {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      clientInfo: { name: "spotlight-test-client", version: "1.0" },
      protocolVersion: "2025-03-26",
      capabilities: {},
    },
    id: "init-1",
  } as JSONRPCMessage,

  toolsList: {
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
    id: "tools-1",
  } as JSONRPCMessage,

  resourcesList: {
    jsonrpc: "2.0",
    method: "resources/list",
    params: {},
    id: "resources-1",
  } as JSONRPCMessage,

  getRecentErrors: {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "get-recent-errors",
      arguments: { count: 5 },
    },
    id: "get-errors-1",
  } as JSONRPCMessage,

  getTraceAnalysis: {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "get-trace-analysis",
      arguments: { traceId: "trace-1" },
    },
    id: "get-trace-1",
  } as JSONRPCMessage,
};

/**
 * Helper to send JSON-RPC request to MCP server
 */
export async function sendMcpRequest(
  baseUrl: URL,
  message: JSONRPCMessage | JSONRPCMessage[],
  sessionId?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
    headers["mcp-protocol-version"] = "2025-03-26";
  }

  return fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
  });
}

/**
 * Helper to extract text from SSE response
 */
export async function readSSEEvent(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  const { value } = await reader!.read();
  return new TextDecoder().decode(value);
}

/**
 * Helper to initialize MCP server and get session ID
 */
export async function initializeMcpServer(baseUrl: URL): Promise<string> {
  const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.initialize);

  if (response.status !== 200) {
    throw new Error(`Failed to initialize MCP server: ${response.status}`);
  }

  const sessionId = response.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error("No session ID returned from server initialization");
  }

  return sessionId;
}
