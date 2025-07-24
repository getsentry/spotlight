import type { Server } from "node:http";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  createTestMcpServer,
  initializeMcpServer,
  readSSEEvent,
  sendMcpRequest,
  stopTestMcpServer,
} from "./__helpers__/mcpTestServer.js";

describe("Real MCP Server Integration Tests", () => {
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

  test("should handle complete workflow with real server", async () => {
    // Test tool execution - get recent errors
    const toolResponse = await sendMcpRequest(
      baseUrl,
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get-recent-errors",
          arguments: { count: 5 },
        },
        id: "get-errors-1",
      },
      sessionId,
    );

    expect(toolResponse.status).toBe(200);
    expect(toolResponse.headers.get("content-type")).toBe("text/event-stream");

    // Test resource access - get recent errors resource
    const resourceResponse = await sendMcpRequest(
      baseUrl,
      {
        jsonrpc: "2.0",
        method: "resources/read",
        params: {
          uri: "spotlight://errors/recent",
        },
        id: "read-resource-1",
      },
      sessionId,
    );

    expect(resourceResponse.status).toBe(200);
    expect(resourceResponse.headers.get("content-type")).toBe("text/event-stream");
  });

  test("should handle trace analysis with real server", async () => {
    // Test trace analysis tool
    const traceResponse = await sendMcpRequest(
      baseUrl,
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get-trace-analysis",
          arguments: { traceId: "trace-1" },
        },
        id: "get-trace-1",
      },
      sessionId,
    );

    expect(traceResponse.status).toBe(200);
    expect(traceResponse.headers.get("content-type")).toBe("text/event-stream");
  });

  test("should handle batch requests with real server", async () => {
    // Test batch requests
    const batchResponse = await sendMcpRequest(
      baseUrl,
      [
        {
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
          id: "tools-1",
        },
        {
          jsonrpc: "2.0",
          method: "resources/list",
          params: {},
          id: "resources-1",
        },
      ],
      sessionId,
    );

    expect(batchResponse.status).toBe(200);
    expect(batchResponse.headers.get("content-type")).toBe("text/event-stream");
  });

  test("should handle protocol error responses with real server", async () => {
    // Test invalid tool call to verify error handling
    const invalidToolResponse = await sendMcpRequest(
      baseUrl,
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "nonexistent-tool",
          arguments: {},
        },
        id: "invalid-tool-1",
      },
      sessionId,
    );

    expect(invalidToolResponse.status).toBe(200);
    expect(invalidToolResponse.headers.get("content-type")).toBe("text/event-stream");

    // Verify error response structure
    const text = await readSSEEvent(invalidToolResponse);
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
      id: "invalid-tool-1",
    });
  });

  test("should handle resource workflow with real server", async () => {
    // First list available resources
    const resourcesListResponse = await sendMcpRequest(
      baseUrl,
      {
        jsonrpc: "2.0",
        method: "resources/list",
        params: {},
        id: "resources-list-1",
      },
      sessionId,
    );

    expect(resourcesListResponse.status).toBe(200);
    expect(resourcesListResponse.headers.get("content-type")).toBe("text/event-stream");

    const listText = await readSSEEvent(resourcesListResponse);
    const listEventLines = listText.split("\n");
    const listDataLine = listEventLines.find(line => line.startsWith("data:"));
    expect(listDataLine).toBeDefined();

    const listEventData = JSON.parse(listDataLine!.substring(5));
    expect(listEventData).toMatchObject({
      jsonrpc: "2.0",
      result: {
        resources: expect.arrayContaining([
          expect.objectContaining({
            uri: "spotlight://errors/recent",
            name: "recent-errors",
          }),
        ]),
      },
      id: "resources-list-1",
    });

    // Then read a specific resource
    const resourceReadResponse = await sendMcpRequest(
      baseUrl,
      {
        jsonrpc: "2.0",
        method: "resources/read",
        params: {
          uri: "spotlight://errors/recent",
        },
        id: "resource-read-1",
      },
      sessionId,
    );

    expect(resourceReadResponse.status).toBe(200);
    expect(resourceReadResponse.headers.get("content-type")).toBe("text/event-stream");

    const readText = await readSSEEvent(resourceReadResponse);
    const readEventLines = readText.split("\n");
    const readDataLine = readEventLines.find(line => line.startsWith("data:"));
    expect(readDataLine).toBeDefined();

    const readEventData = JSON.parse(readDataLine!.substring(5));
    expect(readEventData).toMatchObject({
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
      id: "resource-read-1",
    });
  });
});
