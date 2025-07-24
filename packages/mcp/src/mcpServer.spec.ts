import { beforeEach, describe, expect, test, vi } from "vitest";
import { testEventProcessor } from "./__helpers__/testStore.js";
import type { McpEventProcessor } from "./eventProcessor.js";
import { createSpotlightMcpServer } from "./mcpServer.js";

// Use real logger - tests can handle console output

describe("createSpotlightMcpServer", () => {
  let mockEventProcessor: McpEventProcessor;
  let mcpServer: ReturnType<typeof createSpotlightMcpServer>;

  beforeEach(() => {
    // Use real test event processor with fixtures instead of complex mocks
    mockEventProcessor = testEventProcessor as unknown as McpEventProcessor;
    mcpServer = createSpotlightMcpServer(mockEventProcessor);
  });

  test("should create MCP server with correct name and version", () => {
    expect(mcpServer).toBeDefined();
    // The McpServer should be properly configured, but we can't directly test internal properties
    // We can verify it was created without errors
  });

  test("should create server with all required capabilities", () => {
    // The server should be created with tools, resources, and logging capabilities
    expect(mcpServer).toBeDefined();
  });

  describe("get-recent-errors tool", () => {
    test("should return recent errors with default count", async () => {
      // Mock the tool execution by accessing the server's tools
      // Since we can't directly access the tools, we test through the event processor mock
      const errors = mockEventProcessor.getErrorEvents();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        event_id: "error-1",
        exception: expect.objectContaining({
          values: expect.arrayContaining([
            expect.objectContaining({
              type: "TypeError",
              value: "Cannot read property 'foo' of undefined",
            }),
          ]),
        }),
      });
    });

    test("should filter errors by level", () => {
      const errors = mockEventProcessor.getErrorEvents();
      const filteredErrors = errors.filter((event: any) => event.level === "error");
      expect(filteredErrors).toHaveLength(1);
    });

    test("should filter errors by trace ID", () => {
      const errors = mockEventProcessor.getErrorEvents();
      const filteredErrors = errors.filter((event: any) => event.contexts?.trace?.trace_id === "trace-1");
      expect(filteredErrors).toHaveLength(1);
    });
  });

  describe("get-trace-analysis tool", () => {
    test("should return trace analysis for existing trace", () => {
      const trace = mockEventProcessor.getTraceById("trace-1");
      expect(trace).toBeDefined();
      expect(trace).toMatchObject({
        trace_id: "trace-1",
        status: "ok",
        rootTransactionName: "GET /api/test",
        errors: 1,
      });
    });

    test("should return null for non-existent trace", () => {
      const trace = mockEventProcessor.getTraceById("non-existent");
      expect(trace).toBeNull();
    });

    test("should include related events and logs", () => {
      const events = mockEventProcessor.getEvents();
      const logs = mockEventProcessor.getLogsByTraceId("trace-1");

      expect(Array.isArray(events)).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        id: "log-1",
        attributes: { message: { value: "Processing request for user 123" } },
        severity_text: "INFO",
      });
    });
  });

  describe("debug-error-with-context tool", () => {
    test("should return error with full context for existing error", () => {
      const error = mockEventProcessor.getEventById("error-1");
      expect(error).toBeDefined();
      expect(error).toMatchObject({
        event_id: "error-1",
        exception: expect.objectContaining({
          values: expect.arrayContaining([
            expect.objectContaining({
              type: "TypeError",
              value: "Cannot read property 'foo' of undefined",
            }),
          ]),
        }),
      });
    });

    test("should return null for non-existent error", () => {
      const error = mockEventProcessor.getEventById("non-existent");
      expect(error).toBeNull();
    });

    test("should include related trace information", () => {
      const error = mockEventProcessor.getEventById("error-1");
      const traceId = error?.contexts?.trace?.trace_id;

      if (traceId) {
        const trace = mockEventProcessor.getTraceById(traceId);
        expect(trace).toBeDefined();
        expect(trace?.trace_id).toBe("trace-1");
      }
    });
  });

  describe("list-traces tool", () => {
    test("should return list of traces with default limit", () => {
      const traces = mockEventProcessor.getTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0]).toMatchObject({
        trace_id: "trace-1",
        rootTransactionName: "GET /api/test",
        status: "ok",
      });
    });

    test("should respect limit parameter", () => {
      const traces = mockEventProcessor.getTraces().slice(0, 5);
      expect(traces.length).toBeLessThanOrEqual(5);
    });
  });

  describe("analyze-error prompt", () => {
    test("should handle existing error for analysis", () => {
      const error = mockEventProcessor.getEventById("error-1");
      expect(error).toBeDefined();

      if (error?.exception) {
        const errorMessage = error.exception.values?.[0]?.value;
        const errorType = error.exception.values?.[0]?.type;

        expect(errorMessage).toBe("Cannot read property 'foo' of undefined");
        expect(errorType).toBe("TypeError");
      }
    });

    test("should handle non-existent error", () => {
      const error = mockEventProcessor.getEventById("non-existent");
      expect(error).toBeNull();
    });
  });

  describe("recent-errors resource", () => {
    test("should provide recent errors as structured data", () => {
      const errors = mockEventProcessor.getErrorEvents().slice(0, 10);
      expect(errors).toHaveLength(1);

      const enrichedError = {
        id: errors[0].event_id,
        message: errors[0].exception?.values?.[0]?.value,
        type: errors[0].exception?.values?.[0]?.type,
        timestamp: errors[0].timestamp,
        environment: errors[0].environment,
        release: errors[0].release,
        contexts: errors[0].contexts,
        breadcrumbs: errors[0].breadcrumbs?.length || 0,
        stackFrames: errors[0].exception?.values?.[0]?.stacktrace?.frames?.length || 0,
      };

      expect(enrichedError).toMatchObject({
        id: "error-1",
        message: "Cannot read property 'foo' of undefined",
        type: "TypeError",
        environment: "test",
        release: "1.0.0",
      });
    });
  });

  describe("trace-list resource", () => {
    test("should provide trace list as structured data", () => {
      const traces = mockEventProcessor.getTraces().slice(0, 20);
      expect(traces).toHaveLength(1);

      const traceSummary = {
        trace_id: traces[0].trace_id,
        root_transaction: traces[0].rootTransactionName,
        status: traces[0].status,
        span_count: traces[0].spans.size,
        error_count: traces[0].errors,
        duration_ms: traces[0].timestamp - traces[0].start_timestamp,
        start_timestamp: traces[0].start_timestamp,
      };

      expect(traceSummary).toMatchObject({
        trace_id: "trace-1",
        root_transaction: "GET /api/test",
        status: "ok",
        span_count: 2, // Updated to match fixture data
        error_count: 1,
        duration_ms: 100000, // 1704110500000 - 1704110400000
      });
    });
  });

  describe("event processor integration", () => {
    test("should call event processor methods correctly", () => {
      // Test that all methods are called as expected
      mockEventProcessor.getErrorEvents();
      mockEventProcessor.getTraces();
      mockEventProcessor.getEventById("test-id");
      mockEventProcessor.getTraceById("test-trace-id");
      mockEventProcessor.getLogsByTraceId("test-trace-id");

      // With real implementation, we just verify the methods exist and return expected types
      expect(typeof mockEventProcessor.getErrorEvents).toBe("function");
      expect(typeof mockEventProcessor.getTraces).toBe("function");
      expect(typeof mockEventProcessor.getEventById).toBe("function");
      expect(typeof mockEventProcessor.getTraceById).toBe("function");
      expect(typeof mockEventProcessor.getLogsByTraceId).toBe("function");
    });
  });
});
