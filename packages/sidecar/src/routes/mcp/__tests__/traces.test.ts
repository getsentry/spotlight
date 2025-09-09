import { beforeEach, describe, expect, it } from "vitest";
import { EventContainer } from "../../../utils/eventContainer.js";
import { buildSpanTree, extractTracesFromEnvelopes, formatTraceSummary, renderSpanTree } from "../utils/traces.js";
import { envelopeSecondTransactionEvent, envelopeTransactionEvent } from "./test_envelopes.js";

function createMockEventContainer(event: any): EventContainer {
  // Create a minimal Sentry envelope with the event
  const header = {
    event_id: event.event_id,
    sdk: {
      name: "sentry.javascript.nextjs",
      version: "9.42.1",
    },
  };

  const itemHeader = {
    type: event.type === "transaction" ? "transaction" : "event",
    length: JSON.stringify(event).length,
  };

  const envelope = [JSON.stringify(header), JSON.stringify(itemHeader), JSON.stringify(event)].join("\n");

  return new EventContainer("application/x-sentry-envelope", Buffer.from(envelope, "utf-8"));
}

describe("Trace utilities", () => {
  describe("extractTracesFromEnvelopes", () => {
    it("should extract traces from envelope containers", () => {
      const containers = [
        createMockEventContainer(envelopeTransactionEvent),
        createMockEventContainer(envelopeSecondTransactionEvent),
      ];

      const traces = extractTracesFromEnvelopes(containers);

      expect(traces.size).toBe(2);

      const firstTrace = traces.get("71a8c5e41ae1044dee67f50a07538fe7");
      expect(firstTrace).toBeDefined();
      expect(firstTrace?.root_transaction).toBe("/api/users");
      expect(firstTrace?.span_count).toBe(2);
      expect(firstTrace?.error_count).toBe(0);

      const secondTrace = traces.get("a1b2c3d4e5f6789012345678901234567890abcd");
      expect(secondTrace).toBeDefined();
      expect(secondTrace?.root_transaction).toBe("/api/orders");
      expect(secondTrace?.span_count).toBe(2);
    });

    it("should handle empty containers", () => {
      const traces = extractTracesFromEnvelopes([]);
      expect(traces.size).toBe(0);
    });

    it("should skip events without trace context", () => {
      const eventWithoutTrace = {
        event_id: "no-trace-event",
        type: "error",
        message: "This event has no trace context",
      };

      const containers = [createMockEventContainer(eventWithoutTrace)];
      const traces = extractTracesFromEnvelopes(containers);

      expect(traces.size).toBe(0);
    });
  });

  describe("buildSpanTree", () => {
    it("should build hierarchical span tree", () => {
      const containers = [createMockEventContainer(envelopeTransactionEvent)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("71a8c5e41ae1044dee67f50a07538fe7")!;

      const spanTree = buildSpanTree(trace);

      expect(spanTree.length).toBeGreaterThan(0);

      // Since the transaction has a parent_span_id but no parent, it becomes an orphan
      // The root should be the orphan parent we create
      const rootSpan = spanTree[0];
      expect(rootSpan.op).toBe("orphan");
      expect(rootSpan.children.length).toBe(1);

      // The transaction should be a child of the orphan
      const transactionSpan = rootSpan.children[0];
      expect(transactionSpan).toBeDefined();
      expect(transactionSpan.is_transaction).toBe(true);
      expect(transactionSpan.description).toBe("/api/users");
      expect(transactionSpan.children.length).toBe(2);

      // Check child spans
      const childSpans = transactionSpan.children || [];
      const dbSpan = childSpans.find(span => span.op === "db.query");
      const httpSpan = childSpans.find(span => span.op === "http.client");

      expect(dbSpan).toBeDefined();
      expect(dbSpan?.description).toBe("SELECT * FROM users WHERE id = ?");
      expect(dbSpan?.duration).toBe(10);

      expect(httpSpan).toBeDefined();
      expect(httpSpan?.description).toBe("GET /external-api/profile");
      expect(httpSpan?.duration).toBe(20);
    });

    it("should handle traces with no spans", () => {
      const eventWithoutSpans = {
        ...envelopeTransactionEvent,
        spans: [],
      };

      const containers = [createMockEventContainer(eventWithoutSpans)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("71a8c5e41ae1044dee67f50a07538fe7")!;

      const spanTree = buildSpanTree(trace);

      expect(spanTree.length).toBe(1);

      // Since the transaction has a parent_span_id but no parent, it becomes an orphan
      // The root should be the orphan parent we create
      const rootSpan = spanTree[0];
      expect(rootSpan.op).toBe("orphan");
      expect(rootSpan.children.length).toBe(1);

      // The transaction should be a child of the orphan
      const transactionSpan = rootSpan.children[0];
      expect(transactionSpan.is_transaction).toBe(true);
      expect(transactionSpan.children.length).toBe(0);
    });
  });

  describe("formatTraceSummary", () => {
    it("should format trace summary correctly", () => {
      const containers = [createMockEventContainer(envelopeTransactionEvent)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("71a8c5e41ae1044dee67f50a07538fe7")!;

      const summary = formatTraceSummary(trace);

      expect(summary).toContain("71a8c5e4"); // Short trace ID
      expect(summary).toContain("/api/users"); // Transaction name
      expect(summary).toContain("2 spans"); // Span count
      expect(summary).toContain("0 errors"); // Error count
      expect(summary).toMatch(/\d+ms/); // Duration
    });

    it("should handle trace without transaction name", () => {
      const eventWithoutTransaction = {
        ...envelopeTransactionEvent,
        transaction: undefined,
      };

      const containers = [createMockEventContainer(eventWithoutTransaction)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("71a8c5e41ae1044dee67f50a07538fe7")!;

      const summary = formatTraceSummary(trace);

      expect(summary).toContain("unnamed");
    });
  });

  describe("renderSpanTree", () => {
    it("should render span tree with proper hierarchy", () => {
      const containers = [createMockEventContainer(envelopeTransactionEvent)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("71a8c5e41ae1044dee67f50a07538fe7")!;

      const spanTree = buildSpanTree(trace);
      const rendered = renderSpanTree(spanTree);

      expect(rendered.length).toBeGreaterThan(0);

      // Use inline snapshot to verify exact rendering output
      expect(rendered).toMatchInlineSnapshot(`
        [
          "missing or unknown parent span [ce75b8fe · orphan · unknown]",
          "   └─ /api/users [99b1b00f · 23ms]",
          "      ├─ GET /external-api/profile [def01234 · http.client · 20ms]",
          "      └─ SELECT * FROM users WHERE id = ? [abc12345 · db.query · 10ms]",
        ]
      `);
    });

    it("should render complex tree with multiple roots", () => {
      // Create a trace with multiple root spans
      const multiRootEvent = {
        ...envelopeTransactionEvent,
        contexts: {
          trace: {
            trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
            span_id: "root1",
            parent_span_id: undefined, // No parent - this is a root
          },
        },
      };

      const secondRootEvent = {
        event_id: "second-root",
        type: "transaction",
        transaction: "/api/products",
        timestamp: 1754524400.2,
        contexts: {
          trace: {
            trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
            span_id: "root2",
            parent_span_id: undefined, // Another root
          },
        },
        spans: [],
      };

      const containers = [createMockEventContainer(multiRootEvent), createMockEventContainer(secondRootEvent)];

      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("71a8c5e41ae1044dee67f50a07538fe7")!;
      const spanTree = buildSpanTree(trace);
      const rendered = renderSpanTree(spanTree);

      // When we have multiple roots, we create a synthetic trace root
      expect(rendered).toMatchInlineSnapshot(`
        [
          "Trace 71a8c5e4 [71a8c5e4 · trace · 100ms]",
          "   ├─ /api/users [root1 · 23ms]",
          "   ├─ /api/products [root2 · unknown]",
          "   └─ missing or unknown parent span [99b1b00f · orphan · unknown]",
          "      ├─ SELECT * FROM users WHERE id = ? [abc12345 · db.query · 10ms]",
          "      └─ GET /external-api/profile [def01234 · http.client · 20ms]",
        ]
      `);
    });

    it("should render clean tree without orphans", () => {
      // Create a transaction without a parent_span_id (a true root)
      const rootTransaction = {
        event_id: "root-transaction",
        type: "transaction",
        transaction: "/api/checkout",
        timestamp: 1754524400.15,
        start_timestamp: 1754524400.1,
        contexts: {
          trace: {
            trace_id: "abcd1234567890abcdef1234567890ab",
            span_id: "root123",
            parent_span_id: undefined, // No parent - true root
          },
        },
        spans: [
          {
            span_id: "child1",
            parent_span_id: "root123",
            trace_id: "abcd1234567890abcdef1234567890ab",
            op: "db.query",
            description: "SELECT * FROM orders",
            start_timestamp: 1754524400.11,
            timestamp: 1754524400.125,
            duration: 15,
            status: "ok",
          },
          {
            span_id: "child2",
            parent_span_id: "root123",
            trace_id: "abcd1234567890abcdef1234567890ab",
            op: "cache.set",
            description: "redis.set order:123",
            start_timestamp: 1754524400.13,
            timestamp: 1754524400.135,
            duration: 5,
            status: "ok",
          },
        ],
      };

      const containers = [createMockEventContainer(rootTransaction)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("abcd1234567890abcdef1234567890ab")!;

      const spanTree = buildSpanTree(trace);
      const rendered = renderSpanTree(spanTree);

      // No orphan parent should be created since this is a true root
      expect(rendered).toMatchInlineSnapshot(`
        [
          "/api/checkout [root123 · 50ms]",
          "   ├─ SELECT * FROM orders [child1 · db.query · 15ms]",
          "   └─ redis.set order:123 [child2 · cache.set · 5ms]",
        ]
      `);
    });

    it("should handle empty span tree", () => {
      const rendered = renderSpanTree([]);
      expect(rendered).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle transaction with missing start_timestamp", () => {
      const transactionWithoutStartTime = {
        event_id: "no-start-time",
        type: "transaction",
        transaction: "/api/test",
        timestamp: 1754524400.5, // Only has end timestamp
        // start_timestamp is missing
        contexts: {
          trace: {
            trace_id: "edgecase1234567890abcdef1234567890abcdef",
            span_id: "nostart123",
            parent_span_id: undefined,
          },
        },
        spans: [],
      };

      const containers = [createMockEventContainer(transactionWithoutStartTime)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("edgecase1234567890abcdef1234567890abcdef")!;

      expect(trace).toBeDefined();
      expect(trace.start_timestamp).toBe(1754524400.5); // Falls back to timestamp

      const spanTree = buildSpanTree(trace);
      const rendered = renderSpanTree(spanTree);

      // Should render but with unknown duration
      expect(rendered[0]).toContain("unknown");
    });

    it("should handle spans with calculated duration when duration field is missing", () => {
      const eventWithSpansNoDuration = {
        event_id: "calc-duration-event",
        type: "transaction",
        transaction: "/api/calc",
        timestamp: 1754524400.2,
        start_timestamp: 1754524400.1,
        contexts: {
          trace: {
            trace_id: "calc1234567890abcdef1234567890abcdef",
            span_id: "calc123",
            parent_span_id: undefined,
          },
        },
        spans: [
          {
            span_id: "span-calc-1",
            parent_span_id: "calc123",
            trace_id: "calc1234567890abcdef1234567890abcdef",
            op: "http.request",
            description: "GET /api/data",
            start_timestamp: 1754524400.12,
            timestamp: 1754524400.15,
            // duration is missing - should be calculated
            status: "ok",
          },
        ],
      };

      const containers = [createMockEventContainer(eventWithSpansNoDuration)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("calc1234567890abcdef1234567890abcdef")!;

      const spanTree = buildSpanTree(trace);
      const httpSpan = spanTree[0].children[0]; // First child should be the http span

      // Duration should be calculated as (timestamp - start_timestamp) * 1000
      expect(httpSpan.duration).toBeCloseTo(30, 0); // (0.15 - 0.12) * 1000 = 30ms
    });

    it("should handle deeply nested orphans correctly", () => {
      const deeplyNestedEvent = {
        event_id: "deep-nested",
        type: "transaction",
        transaction: "/api/nested",
        timestamp: 1754524400.3,
        start_timestamp: 1754524400.1,
        contexts: {
          trace: {
            trace_id: "nested1234567890abcdef1234567890abcdef",
            span_id: "deepspan1",
            parent_span_id: "missing-parent-1", // Parent doesn't exist
          },
        },
        spans: [
          {
            span_id: "deepspan2",
            parent_span_id: "missing-parent-2", // Different missing parent
            trace_id: "nested1234567890abcdef1234567890abcdef",
            op: "db.query",
            description: "SELECT * FROM nested",
            duration: 10,
          },
          {
            span_id: "deepspan3",
            parent_span_id: "deepspan2", // Parent is also an orphan
            trace_id: "nested1234567890abcdef1234567890abcdef",
            op: "cache.get",
            description: "redis.get nested:key",
            duration: 5,
          },
        ],
      };

      const containers = [createMockEventContainer(deeplyNestedEvent)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("nested1234567890abcdef1234567890abcdef")!;

      const spanTree = buildSpanTree(trace);
      const rendered = renderSpanTree(spanTree);

      // Should create orphan parents for both missing parents
      const orphanCount = rendered.filter(line => line.includes("orphan")).length;
      expect(orphanCount).toBeGreaterThanOrEqual(2);
    });

    it("should handle circular parent references gracefully", () => {
      // This is a malformed trace but shouldn't crash
      const circularEvent = {
        event_id: "circular-event",
        type: "transaction",
        transaction: "/api/circular",
        timestamp: 1754524400.2,
        start_timestamp: 1754524400.1,
        contexts: {
          trace: {
            trace_id: "circular1234567890abcdef1234567890abcdef",
            span_id: "circ1",
            parent_span_id: "circ2", // Points to child - circular reference
          },
        },
        spans: [
          {
            span_id: "circ2",
            parent_span_id: "circ1", // Points back to parent - circular
            trace_id: "circular1234567890abcdef1234567890abcdef",
            op: "http",
            description: "Circular span",
            duration: 10,
          },
        ],
      };

      const containers = [createMockEventContainer(circularEvent)];

      // Should not throw
      expect(() => {
        const traces = extractTracesFromEnvelopes(containers);
        const trace = traces.get("circular1234567890abcdef1234567890abcdef")!;
        const spanTree = buildSpanTree(trace);
        renderSpanTree(spanTree);
      }).not.toThrow();
    });

    it("should handle trace with only error events (no transactions)", () => {
      const errorOnlyEvent = {
        event_id: "error-only",
        type: "error",
        message: "Something went wrong",
        timestamp: 1754524400.1,
        contexts: {
          trace: {
            trace_id: "error1234567890abcdef1234567890abcdef",
            span_id: "errorspan1",
            parent_span_id: undefined,
          },
        },
        exception: {
          values: [
            {
              type: "Error",
              value: "Test error",
            },
          ],
        },
      };

      const containers = [createMockEventContainer(errorOnlyEvent)];
      const traces = extractTracesFromEnvelopes(containers);
      const trace = traces.get("error1234567890abcdef1234567890abcdef")!;

      expect(trace).toBeDefined();
      expect(trace.error_count).toBe(1);
      expect(trace.root_transaction).toBeUndefined();

      const spanTree = buildSpanTree(trace);
      expect(spanTree.length).toBeGreaterThan(0);
      expect(spanTree[0].op).toBe("error");
    });
  });

  describe("integration test", () => {
    it("should process multiple traces and maintain separation", () => {
      const containers = [
        createMockEventContainer(envelopeTransactionEvent),
        createMockEventContainer(envelopeSecondTransactionEvent),
      ];

      const traces = extractTracesFromEnvelopes(containers);

      expect(traces.size).toBe(2);

      // Verify each trace is properly isolated
      for (const [traceId, trace] of traces) {
        expect(trace.trace_id).toBe(traceId);
        expect(trace.events.length).toBe(1);
        expect(trace.span_count).toBe(2);

        const spanTree = buildSpanTree(trace);
        expect(spanTree.length).toBeGreaterThan(0);

        const summary = formatTraceSummary(trace);
        expect(summary).toContain(traceId.substring(0, 8));
      }
    });
  });
});
