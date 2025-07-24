import { mockErrorEvent, mockLogEvent, mockTrace, mockTransactionEvent } from "../__fixtures__/sentryEvents.js";
// Test store factory to use real store with fixtures instead of mocks
import type { ContextLinesHandler } from "../nodeCompatibilityLayer.js";

// Simplified test store without external dependencies
export function createTestStore(_contextLinesHandler?: ContextLinesHandler) {
  // For now, return a simple object that matches the expected interface
  // This avoids the overlay dependency issue
  return {
    getState: () => ({
      eventsById: new Map(),
      tracesById: new Map(),
      logsById: new Map(),
      logsByTraceId: new Map(),
    }),
  };
}

export function createPopulatedTestStore(_contextLinesHandler?: ContextLinesHandler) {
  // Return store pre-populated with test data
  return {
    getState: () => ({
      eventsById: new Map([["error-1", mockErrorEvent]]),
      tracesById: new Map([["trace-1", mockTrace]]),
      logsById: new Map([["log-1", mockLogEvent]]),
      logsByTraceId: new Map([["trace-1", [mockLogEvent]]]),
    }),
  };
}

// Test data helpers
export const testEventProcessor = {
  getEvents: () => [mockErrorEvent, mockTransactionEvent],
  getErrorEvents: () => [mockErrorEvent],
  getTransactionEvents: () => [mockTransactionEvent],
  getTraces: () => [mockTrace],
  getEventById: (id: string) => (id === "error-1" ? mockErrorEvent : null),
  getTraceById: (id: string) => (id === "trace-1" ? mockTrace : null),
  getLogsByTraceId: (id: string) => (id === "trace-1" ? [mockLogEvent] : []),
  getLogs: () => [mockLogEvent],
  getProfiles: () => [],
  getSdks: () => [],
  resetData: () => {},
};
