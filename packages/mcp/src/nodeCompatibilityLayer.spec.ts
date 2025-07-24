import { beforeEach, describe, expect, test, vi } from "vitest";
import type { SentryErrorEvent } from "./nodeAdapter.js";
import { type ContextLinesHandler, createNodeSettingsSlice, createNodeSharedSlice } from "./nodeCompatibilityLayer.js";

describe("nodeCompatibilityLayer", () => {
  describe("createNodeSettingsSlice", () => {
    let mockSet: any;
    let settingsSlice: ReturnType<typeof createNodeSettingsSlice>;

    beforeEach(() => {
      mockSet = vi.fn();
      settingsSlice = createNodeSettingsSlice(mockSet, () => ({}) as any, {} as any);
    });

    test("should initialize with internal context lines provider", () => {
      expect(settingsSlice.contextLinesProvider).toBe("internal://sidecar/context-lines");
    });

    test("should handle setSidecarUrl as no-op", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      settingsSlice.setSidecarUrl("http://localhost:8969");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Node.js sidecar: setSidecarUrl called with http://localhost:8969, ignoring",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("createNodeSharedSlice", () => {
    let mockSet: any;
    let mockGet: any;
    let mockContextLinesHandler: ContextLinesHandler;
    let sharedSlice: ReturnType<ReturnType<typeof createNodeSharedSlice>>;

    beforeEach(() => {
      mockSet = vi.fn();
      mockGet = vi.fn().mockReturnValue({
        eventsById: new Map([["event-1", { event_id: "event-1", message: "Test event" }]]),
        tracesById: new Map([["trace-1", { trace_id: "trace-1", rootTransactionName: "Test trace" }]]),
        getEvents: () => [
          {
            event_id: "event-1",
            contexts: { trace: { trace_id: "trace-1", span_id: "span-1" } },
          },
          {
            event_id: "event-2",
            contexts: { trace: { trace_id: "trace-1", span_id: "span-2" } },
          },
          {
            event_id: "event-3",
            contexts: { trace: { trace_id: "trace-2", span_id: "span-3" } },
          },
        ],
        envelopes: new Map(),
        sdks: new Map(),
        profilesByTraceId: new Map(),
        localTraceIds: new Set(),
        logsById: new Map(),
        logsByTraceId: new Map(),
      });

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

      sharedSlice = createNodeSharedSlice(mockContextLinesHandler)(mockSet, mockGet, undefined as any);
    });

    test("should get event by ID", () => {
      const event = sharedSlice.getEventById("event-1");
      expect(event).toEqual({ event_id: "event-1", message: "Test event" });
    });

    test("should get trace by ID", () => {
      const trace = sharedSlice.getTraceById("trace-1");
      expect(trace).toEqual({ trace_id: "trace-1", rootTransactionName: "Test trace" });
    });

    test("should get events by trace ID", () => {
      const events = sharedSlice.getEventsByTrace("trace-1");
      expect(events).toHaveLength(2);
      expect(events[0].event_id).toBe("event-1");
      expect(events[1].event_id).toBe("event-2");
    });

    test("should get events by trace ID and span ID", () => {
      const events = sharedSlice.getEventsByTrace("trace-1", "span-1");
      expect(events).toHaveLength(1);
      expect(events[0].event_id).toBe("event-1");
    });

    test("should return empty array for non-existent trace ID", () => {
      const events = sharedSlice.getEventsByTrace("non-existent");
      expect(events).toHaveLength(0);
    });

    test("should process stacktrace with context lines handler", async () => {
      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Test error",
              stacktrace: {
                frames: [
                  {
                    filename: "test.js",
                    function: "testFunction",
                    lineno: 10,
                    colno: 5,
                  },
                ],
              },
            },
          ],
          value: undefined,
        },
        timestamp: Date.now(),
      };

      await sharedSlice.processStacktrace(errorEvent);

      expect(mockContextLinesHandler).toHaveBeenCalledWith({
        frames: [
          {
            filename: "test.js",
            function: "testFunction",
            lineno: 10,
            colno: 5,
          },
        ],
      });

      // Check that stacktrace was updated
      expect(errorEvent.exception.values![0].stacktrace).toEqual({
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

    test("should skip stacktrace processing when frames already have context", async () => {
      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Test error",
              stacktrace: {
                frames: [
                  {
                    filename: "test.js",
                    function: "testFunction",
                    lineno: 10,
                    colno: 5,
                    context_line: "existing context",
                    pre_context: ["existing pre"],
                    post_context: ["existing post"],
                  },
                ],
              },
            },
          ],
          value: undefined,
        },
        timestamp: Date.now(),
      };

      await sharedSlice.processStacktrace(errorEvent);

      expect(mockContextLinesHandler).not.toHaveBeenCalled();
    });

    test("should handle stacktrace processing without context lines handler", async () => {
      const sliceWithoutHandler = createNodeSharedSlice()(mockSet, mockGet, undefined as any);

      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Test error",
              stacktrace: {
                frames: [
                  {
                    filename: "test.js",
                    function: "testFunction",
                    lineno: 10,
                    colno: 5,
                  },
                ],
              },
            },
          ],
          value: undefined,
        },
        timestamp: Date.now(),
      };

      await expect(sliceWithoutHandler.processStacktrace(errorEvent)).resolves.not.toThrow();
    });

    test("should handle stacktrace processing errors gracefully", async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error("Context handler failed"));
      const sliceWithFailingHandler = createNodeSharedSlice(errorHandler)(mockSet, mockGet, undefined as any);

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Test error",
              stacktrace: {
                frames: [
                  {
                    filename: "test.js",
                    function: "testFunction",
                    lineno: 10,
                    colno: 5,
                  },
                ],
              },
            },
          ],
          value: undefined,
        },
        timestamp: Date.now(),
      };

      await sliceWithFailingHandler.processStacktrace(errorEvent);

      expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to process stacktrace in MCP:", expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    test("should handle error event without exception values", async () => {
      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: undefined,
          value: {
            type: "Error",
            value: "Test error",
          },
        },
        timestamp: Date.now(),
      };

      await expect(sharedSlice.processStacktrace(errorEvent)).resolves.not.toThrow();
      expect(mockContextLinesHandler).not.toHaveBeenCalled();
    });

    test("should handle exception without stacktrace", async () => {
      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Test error",
            },
          ],
          value: undefined,
        },
        timestamp: Date.now(),
      };

      await expect(sharedSlice.processStacktrace(errorEvent)).resolves.not.toThrow();
      expect(mockContextLinesHandler).not.toHaveBeenCalled();
    });

    test("should reset data correctly", () => {
      sharedSlice.resetData();

      expect(mockSet).toHaveBeenCalledWith({
        envelopes: expect.any(Map),
        eventsById: expect.any(Map),
        tracesById: expect.any(Map),
        sdks: expect.any(Map),
        profilesByTraceId: expect.any(Map),
        localTraceIds: expect.any(Set),
        logsById: expect.any(Map),
        logsByTraceId: expect.any(Map),
      });
    });

    test("should reverse stacktrace frames before processing", async () => {
      // Create a slice without context handler to avoid interference
      const sliceWithoutHandler = createNodeSharedSlice()(mockSet, mockGet, undefined as any);

      const errorEvent: SentryErrorEvent = {
        event_id: "error-1",
        type: "error",
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Test error",
              stacktrace: {
                frames: [
                  {
                    filename: "test1.js",
                    function: "function1",
                    lineno: 1,
                  },
                  {
                    filename: "test2.js",
                    function: "function2",
                    lineno: 2,
                  },
                ],
              },
            },
          ],
          value: undefined,
        },
        timestamp: Date.now(),
      };

      await sliceWithoutHandler.processStacktrace(errorEvent);

      // Verify frames were reversed (the first frame should now be the second from original)
      const processedFrames = errorEvent.exception.values![0].stacktrace!.frames;
      expect(processedFrames[0].filename).toBe("test2.js");
      expect(processedFrames[1].filename).toBe("test1.js");
    });
  });
});
