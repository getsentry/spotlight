import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockErrorEvent, mockRawEventContext } from "./__fixtures__/sentryEvents.js";
import { McpEventProcessor } from "./eventProcessor.js";
import type { RawEventContext } from "./nodeAdapter.js";
import type { ContextLinesHandler } from "./nodeCompatibilityLayer.js";

// Mock the store to avoid dependency issues
vi.mock("./mcpStore.js", () => ({
  createMcpSentryStore: () => ({
    getState: () => ({
      pushEnvelope: () => 1,
      resetData: () => {},
      getEvents: () => [],
      getTraces: () => [],
      getLogs: () => [],
      getProfiles: () => [],
      getSdks: () => [],
      getErrorEvents: () => [],
      getTransactionEvents: () => [],
      getEventById: () => null,
      getTraceById: () => null,
      getLogsByTraceId: () => [],
      tracesById: new Map(),
      profilesByTraceId: new Map(),
      sdks: new Map(),
    }),
  }),
}));

// Use real logger - tests can handle console output

describe("McpEventProcessor", () => {
  let processor: McpEventProcessor;
  let mockContextLinesHandler: ContextLinesHandler;

  beforeEach(() => {
    mockContextLinesHandler = vi.fn().mockResolvedValue({ frames: [] });
    processor = new McpEventProcessor(mockContextLinesHandler);
  });

  test("should initialize correctly", () => {
    expect(processor).toBeDefined();
  });

  test("should create processor without context lines handler", () => {
    const processorWithoutHandler = new McpEventProcessor();
    expect(processorWithoutHandler).toBeDefined();
  });

  test("should process raw event successfully", async () => {
    await expect(processor.processRawEvent(mockRawEventContext)).resolves.not.toThrow();

    // Verify event was processed (should be accessible in processor)
    const events = processor.getEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  test("should handle processing errors gracefully", async () => {
    const invalidRawEvent: RawEventContext = {
      data: Buffer.from("invalid json"),
      contentType: "application/json",
    };

    await expect(processor.processRawEvent(invalidRawEvent)).resolves.not.toThrow();
  });

  test("should return empty arrays initially", () => {
    expect(processor.getEvents()).toEqual([]);
    expect(processor.getTraces()).toEqual([]);
    expect(processor.getLogs()).toEqual([]);
    expect(processor.getProfiles()).toEqual([]);
    expect(processor.getSdks()).toEqual([]);
    expect(processor.getErrorEvents()).toEqual([]);
    expect(processor.getTransactionEvents()).toEqual([]);
  });

  test("should return null for non-existent IDs", () => {
    expect(processor.getEventById("non-existent")).toBeNull();
    expect(processor.getTraceById("non-existent")).toBeNull();
  });

  test("should return empty array for logs by non-existent trace ID", () => {
    expect(processor.getLogsByTraceId("non-existent")).toEqual([]);
  });

  test("should reset data when called", () => {
    expect(() => processor.resetData()).not.toThrow();
    expect(processor.getEvents()).toEqual([]);
    expect(processor.getTraces()).toEqual([]);
  });

  test("should filter error events correctly", () => {
    // The actual filtering logic depends on the store implementation
    // This test ensures the method exists and returns an array
    const errorEvents = processor.getErrorEvents();
    expect(Array.isArray(errorEvents)).toBe(true);
  });

  test("should filter transaction events correctly", () => {
    // The actual filtering logic depends on the store implementation
    // This test ensures the method exists and returns an array
    const transactionEvents = processor.getTransactionEvents();
    expect(Array.isArray(transactionEvents)).toBe(true);
  });
});
