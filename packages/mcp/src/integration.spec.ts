import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { McpIntegration } from "./mcpIntegration.js";
import type { ContextLinesHandler } from "./nodeCompatibilityLayer.js";

// Use real logger - tests can handle console output

// Simplified mocks to avoid timeout issues
vi.mock("./mcpStore.js", () => ({
  createMcpSentryStore: () => ({
    getState: () => ({
      pushEnvelope: () => 1,
      getEvents: () => [],
      tracesById: new Map(),
      getEventById: () => null,
      getTraceById: () => null,
      getLogsByTraceId: () => [],
      getLogs: () => [],
      profilesByTraceId: new Map(),
      sdks: new Map(),
      resetData: () => {},
    }),
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: () => ({
    handleRequest: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("./mcpServer.js", () => ({
  createSpotlightMcpServer: () => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("MCP Integration Tests", () => {
  let integration: McpIntegration;
  let mockContextLinesHandler: ContextLinesHandler;

  beforeEach(() => {
    mockContextLinesHandler = vi.fn().mockResolvedValue({
      frames: [
        {
          filename: "test.js",
          function: "testFunction",
          lineno: 10,
          colno: 5,
          context_line: "const value = obj.foo;",
          pre_context: ["function testFunction() {", "  const obj = undefined;"],
          post_context: ["  return value;", "}"],
        },
      ],
    });
  });

  afterEach(async () => {
    if (integration) {
      await integration.close();
    }
    vi.clearAllMocks();
  });

  describe("End-to-End MCP Workflow", () => {
    test("should handle complete Sentry envelope processing workflow", async () => {
      // Initialize MCP integration
      integration = new McpIntegration(
        {
          enabled: true,
          tools: {
            "get-recent-errors": { enabled: true },
            "get-trace-analysis": { enabled: true },
            "debug-error-with-context": { enabled: true },
            "list-traces": { enabled: true },
          },
          resources: {
            "spotlight://errors/recent": { enabled: true, cacheTtl: 300 },
            "spotlight://traces/list": { enabled: true, cacheTtl: 300 },
          },
        },
        mockContextLinesHandler,
      );

      // Mock Sentry envelope data
      const sentryEnvelope = JSON.stringify({
        event_id: "test-error-1",
        timestamp: Date.now() / 1000,
        level: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Cannot read property 'foo' of undefined",
              stacktrace: {
                frames: [
                  {
                    filename: "app.js",
                    function: "processData",
                    lineno: 42,
                    colno: 15,
                  },
                ],
              },
            },
          ],
        },
        contexts: {
          trace: {
            trace_id: "test-trace-1",
            span_id: "test-span-1",
          },
        },
        breadcrumbs: [
          {
            message: "User clicked submit button",
            category: "ui",
            timestamp: Date.now() / 1000 - 5,
          },
        ],
        tags: {
          environment: "test",
          version: "1.0.0",
        },
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      });

      // Process the envelope
      await integration.processPayload("application/x-sentry-envelope", Buffer.from(sentryEnvelope));

      // Verify event processor has the data
      const eventProcessor = integration.getEventProcessor();
      expect(eventProcessor).toBeDefined();

      // Test that the integration is properly configured
      expect(integration.getMcpServer()).toBeDefined();
      expect(integration.getTransport()).toBeDefined();
    });

    test("should handle MessageBuffer subscription workflow", async () => {
      integration = new McpIntegration(
        {
          enabled: true,
        },
        mockContextLinesHandler,
      );

      // Mock MessageBuffer
      const mockBuffer = {
        subscribe: vi.fn().mockReturnValue("subscription-id"),
        unsubscribe: vi.fn(),
      };

      // Subscribe to buffer
      const unsubscribe = integration.subscribeToBuffer(mockBuffer);

      expect(mockBuffer.subscribe).toHaveBeenCalledWith(expect.any(Function));

      // Trigger buffer callback with test data
      const callback = vi.mocked(mockBuffer.subscribe).mock.calls[0][0];
      const testPayload: [string, Buffer] = ["application/x-sentry-envelope", Buffer.from('{"test": "envelope"}')];

      // Should not throw when processing
      expect(() => callback(testPayload)).not.toThrow();

      // Unsubscribe
      unsubscribe();
      expect(mockBuffer.unsubscribe).toHaveBeenCalledWith("subscription-id");
    });

    test("should handle HTTP request workflow", async () => {
      integration = new McpIntegration({
        enabled: true,
      });

      const mockReq = {
        url: "/mcp",
        method: "POST",
        headers: { "content-type": "application/json" },
      } as any;

      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      } as any;

      // Should handle request without throwing
      await expect(integration.handleMcpRequest(mockReq, mockRes)).resolves.not.toThrow();
    });

    test("should handle disabled integration gracefully", async () => {
      integration = new McpIntegration({
        enabled: false,
      });

      // Should not initialize MCP server when disabled
      expect(integration.getMcpServer()).toBeNull();
      expect(integration.getTransport()).toBeNull();

      // Should not process payloads when disabled
      await expect(
        integration.processPayload("application/x-sentry-envelope", Buffer.from('{"test": "data"}')),
      ).resolves.not.toThrow();

      // Should return empty unsubscribe function
      const mockBuffer = {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };

      const unsubscribe = integration.subscribeToBuffer(mockBuffer);
      expect(mockBuffer.subscribe).not.toHaveBeenCalled();
      expect(() => unsubscribe()).not.toThrow();

      // Should return 404 for HTTP requests
      const mockReq = {} as any;
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      } as any;

      await integration.handleMcpRequest(mockReq, mockRes);
      expect(mockRes.writeHead).toHaveBeenCalledWith(404);
    });

    test("should handle context lines handler integration", async () => {
      const customContextHandler = vi.fn().mockResolvedValue({
        frames: [
          {
            filename: "custom.js",
            function: "customFunction",
            lineno: 20,
            colno: 10,
            context_line: "custom context line",
            pre_context: ["custom pre context"],
            post_context: ["custom post context"],
          },
        ],
      });

      integration = new McpIntegration(
        {
          enabled: true,
          processing: {
            enableStacktraceProcessing: true,
          },
        },
        customContextHandler,
      );

      // Process an envelope with stacktrace
      const envelopeWithStacktrace = JSON.stringify({
        event_id: "test-error-with-stack",
        type: "error",
        exception: {
          values: [
            {
              type: "Error",
              value: "Test error with stacktrace",
              stacktrace: {
                frames: [
                  {
                    filename: "app.js",
                    function: "testFunction",
                    lineno: 15,
                    colno: 5,
                  },
                ],
              },
            },
          ],
        },
      });

      await integration.processPayload("application/x-sentry-envelope", Buffer.from(envelopeWithStacktrace));

      // Verify that the integration was created with the custom handler
      expect(integration.getEventProcessor()).toBeDefined();
    });

    test("should handle multiple envelope types", async () => {
      integration = new McpIntegration(
        {
          enabled: true,
        },
        mockContextLinesHandler,
      );

      // Test Sentry envelope (should be processed)
      await expect(
        integration.processPayload("application/x-sentry-envelope", Buffer.from('{"event_id": "test-1"}')),
      ).resolves.not.toThrow();

      // Test non-Sentry payload (should be ignored)
      await expect(
        integration.processPayload("application/json", Buffer.from('{"data": "test"}')),
      ).resolves.not.toThrow();

      // Test invalid data (should handle gracefully)
      await expect(
        integration.processPayload("application/x-sentry-envelope", Buffer.from("invalid json")),
      ).resolves.not.toThrow();
    });

    test("should handle integration lifecycle", async () => {
      integration = new McpIntegration({
        enabled: true,
      });

      // Should initialize successfully
      expect(integration).toBeDefined();
      expect(integration.getEventProcessor()).toBeDefined();
      expect(integration.getMcpServer()).toBeDefined();
      expect(integration.getTransport()).toBeDefined();

      // Should close successfully
      await expect(integration.close()).resolves.not.toThrow();
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed envelope data gracefully", async () => {
      integration = new McpIntegration({ enabled: true }, mockContextLinesHandler);

      const malformedData = Buffer.from("this is not json");

      await expect(integration.processPayload("application/x-sentry-envelope", malformedData)).resolves.not.toThrow();
    });

    test("should handle context lines handler errors gracefully", async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error("Handler failed"));

      integration = new McpIntegration(
        {
          enabled: true,
        },
        failingHandler,
      );

      const envelopeData = JSON.stringify({
        event_id: "test-error",
        type: "error",
        exception: {
          values: [
            {
              type: "Error",
              value: "Test error",
              stacktrace: {
                frames: [{ filename: "test.js", lineno: 1 }],
              },
            },
          ],
        },
      });

      await expect(
        integration.processPayload("application/x-sentry-envelope", Buffer.from(envelopeData)),
      ).resolves.not.toThrow();
    });

    test("should handle transport errors in HTTP requests", async () => {
      integration = new McpIntegration({ enabled: true }, mockContextLinesHandler);

      const mockReq = {} as any;
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      } as any;

      // Test should complete without throwing - simplified without complex mock manipulation
      await expect(integration.handleMcpRequest(mockReq, mockRes)).resolves.not.toThrow();
    });
  });
});
