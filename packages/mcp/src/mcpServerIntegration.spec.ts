import type { Server } from "node:http";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  MCP_TEST_MESSAGES,
  createTestMcpServer,
  initializeMcpServer,
  readSSEEvent,
  sendMcpRequest,
  stopTestMcpServer,
} from "./__helpers__/mcpTestServer.js";

describe("MCP Server Integration", () => {
  let server: Server;
  let transport: StreamableHTTPServerTransport;
  let baseUrl: URL;
  let sessionId: string;

  beforeEach(async () => {
    const result = await createTestMcpServer();
    server = result.server;
    transport = result.transport;
    baseUrl = result.baseUrl;

    // Initialize server and get session ID
    sessionId = await initializeMcpServer(baseUrl);
  });

  afterEach(async () => {
    await stopTestMcpServer({ server, transport });
  });

  describe("Server Initialization", () => {
    test("should initialize with correct capabilities", async () => {
      // Server should already be initialized in beforeEach
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    test("should reject second initialization", async () => {
      const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.initialize, sessionId);

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData).toMatchObject({
        jsonrpc: "2.0",
        error: expect.objectContaining({
          code: -32600,
          message: expect.stringMatching(/Server already initialized/),
        }),
      });
    });
  });

  describe("Tools", () => {
    test("should list available tools", async () => {
      const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.toolsList, sessionId);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/event-stream");

      const text = await readSSEEvent(response);
      const eventLines = text.split("\n");
      const dataLine = eventLines.find(line => line.startsWith("data:"));
      expect(dataLine).toBeDefined();

      const eventData = JSON.parse(dataLine!.substring(5));
      expect(eventData).toMatchObject({
        jsonrpc: "2.0",
        result: {
          tools: expect.arrayContaining([
            expect.objectContaining({
              name: "get-recent-errors",
              title: "Get Recent Errors with Full Context",
            }),
            expect.objectContaining({
              name: "get-trace-analysis",
              title: "Get Complete Trace Analysis",
            }),
            expect.objectContaining({
              name: "debug-error-with-context",
              title: "Debug Error with Full Context",
            }),
            expect.objectContaining({
              name: "list-traces",
              title: "List All Available Traces",
            }),
          ]),
        },
        id: "tools-1",
      });
    });

    test("should execute get-recent-errors tool", async () => {
      const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.getRecentErrors, sessionId);

      expect(response.status).toBe(200);

      const text = await readSSEEvent(response);
      const eventLines = text.split("\n");
      const dataLine = eventLines.find(line => line.startsWith("data:"));
      expect(dataLine).toBeDefined();

      const eventData = JSON.parse(dataLine!.substring(5));
      expect(eventData).toMatchObject({
        jsonrpc: "2.0",
        result: {
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringContaining("error-1"), // Contains our test error
            }),
          ]),
        },
        id: "get-errors-1",
      });
    });

    test("should execute get-trace-analysis tool", async () => {
      const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.getTraceAnalysis, sessionId);

      expect(response.status).toBe(200);

      const text = await readSSEEvent(response);
      const eventLines = text.split("\n");
      const dataLine = eventLines.find(line => line.startsWith("data:"));
      expect(dataLine).toBeDefined();

      const eventData = JSON.parse(dataLine!.substring(5));
      expect(eventData).toMatchObject({
        jsonrpc: "2.0",
        result: {
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringContaining("trace-1"), // Contains our test trace
            }),
          ]),
        },
        id: "get-trace-1",
      });
    });

    test("should handle tool errors gracefully", async () => {
      const invalidToolCall = {
        jsonrpc: "2.0" as const,
        method: "tools/call",
        params: {
          name: "nonexistent-tool",
          arguments: {},
        },
        id: "invalid-tool",
      };

      const response = await sendMcpRequest(baseUrl, invalidToolCall, sessionId);

      expect(response.status).toBe(200);

      const text = await readSSEEvent(response);
      const eventLines = text.split("\n");
      const dataLine = eventLines.find(line => line.startsWith("data:"));
      expect(dataLine).toBeDefined();

      const eventData = JSON.parse(dataLine!.substring(5));
      expect(eventData).toMatchObject({
        jsonrpc: "2.0",
        error: expect.objectContaining({
          code: expect.any(Number),
          message: expect.any(String),
        }),
        id: "invalid-tool",
      });
    });
  });

  describe("Resources", () => {
    test("should list available resources", async () => {
      const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.resourcesList, sessionId);

      expect(response.status).toBe(200);

      const text = await readSSEEvent(response);
      const eventLines = text.split("\n");
      const dataLine = eventLines.find(line => line.startsWith("data:"));
      expect(dataLine).toBeDefined();

      const eventData = JSON.parse(dataLine!.substring(5));
      expect(eventData).toMatchObject({
        jsonrpc: "2.0",
        result: {
          resources: expect.arrayContaining([
            expect.objectContaining({
              uri: "spotlight://errors/recent",
              name: "recent-errors",
            }),
            expect.objectContaining({
              uri: "spotlight://traces/list",
              name: "trace-list",
            }),
          ]),
        },
        id: "resources-1",
      });
    });

    test("should read recent-errors resource", async () => {
      const readResourceMessage = {
        jsonrpc: "2.0" as const,
        method: "resources/read",
        params: {
          uri: "spotlight://errors/recent",
        },
        id: "read-resource-1",
      };

      const response = await sendMcpRequest(baseUrl, readResourceMessage, sessionId);

      expect(response.status).toBe(200);

      const text = await readSSEEvent(response);
      const eventLines = text.split("\n");
      const dataLine = eventLines.find(line => line.startsWith("data:"));
      expect(dataLine).toBeDefined();

      const eventData = JSON.parse(dataLine!.substring(5));
      expect(eventData).toMatchObject({
        jsonrpc: "2.0",
        result: {
          contents: expect.arrayContaining([
            expect.objectContaining({
              uri: "spotlight://errors/recent",
              mimeType: "application/json",
              text: expect.any(String),
            }),
          ]),
        },
        id: "read-resource-1",
      });
    });
  });

  describe("Batch Requests", () => {
    test("should handle batch tool requests", async () => {
      const batchRequests = [MCP_TEST_MESSAGES.toolsList, MCP_TEST_MESSAGES.getRecentErrors];

      const response = await sendMcpRequest(baseUrl, batchRequests, sessionId);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/event-stream");

      const text = await readSSEEvent(response);

      // Should contain responses for both requests
      expect(text).toContain('"id":"tools-1"');
      expect(text).toContain('"id":"get-errors-1"');
      expect(text).toContain('"tools"'); // tools/list result
      expect(text).toContain("error-1"); // get-recent-errors result
    });
  });

  describe("Protocol Compliance", () => {
    test("should reject invalid JSON-RPC messages", async () => {
      const invalidMessage = { method: "tools/list", id: 1 }; // missing jsonrpc version

      const response = await sendMcpRequest(baseUrl, invalidMessage as any, sessionId);

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData).toMatchObject({
        jsonrpc: "2.0",
        error: expect.objectContaining({
          code: expect.any(Number),
          message: expect.any(String),
        }),
      });
    });

    test("should reject requests without session ID", async () => {
      const response = await sendMcpRequest(baseUrl, MCP_TEST_MESSAGES.toolsList);

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData).toMatchObject({
        jsonrpc: "2.0",
        error: expect.objectContaining({
          code: -32000,
          message: expect.stringMatching(/Bad Request/),
        }),
      });
    });
  });
});
