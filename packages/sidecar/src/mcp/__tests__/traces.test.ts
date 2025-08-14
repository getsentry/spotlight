import { beforeEach, describe, expect, it } from "vitest";
import { EventContainer } from "../../eventContainer.js";
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
    type: event.type || "event",
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
          "   └─ /api/users [99b1b00f · 18ms]",
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
          "Trace 71a8c5e4 [71a8c5e4 · trace · 77ms]",
          "   ├─ /api/users [root1 · 18ms]",
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
          "/api/checkout [root123 · 40ms]",
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
