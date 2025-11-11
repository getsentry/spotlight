import type { Envelope, EnvelopeItem } from "@sentry/core";
import { type SentryTransactionEvent, processEnvelope } from "@spotlight/sidecar/parser/index.js";
import type { EventContainer } from "@spotlight/sidecar/utils/index.js";
import { formatTimestamp, getDuration } from "../utils.js";

export interface TraceContext {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
}

export interface SpanData {
  span_id: string;
  parent_span_id?: string;
  trace_id: string;
  op?: string;
  description?: string;
  start_timestamp?: number;
  timestamp?: number;
  duration?: number;
  status?: string;
  data?: Record<string, unknown>;
}

export interface TraceEvent {
  event_id: string;
  type: string;
  timestamp?: number;
  start_timestamp?: number;
  transaction?: string;
  trace_context?: TraceContext;
  spans?: SpanData[];
  level?: string;
  platform?: string;
  message?: string;
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
    }>;
  };
}

export interface TraceSummary {
  trace_id: string;
  root_transaction?: string;
  start_timestamp?: number;
  duration?: number;
  span_count: number;
  error_count: number;
  events: TraceEvent[];
}

/**
 * Extract trace events from envelopes and group by trace ID
 */
export function extractTracesFromEnvelopes(containers: EventContainer[]): Map<string, TraceSummary> {
  const traces = new Map<string, TraceSummary>();

  for (const container of containers) {
    try {
      const events = extractTraceEventsFromContainer(container);

      for (const event of events) {
        if (!event.trace_context?.trace_id) continue;

        const traceId = event.trace_context.trace_id;

        if (!traces.has(traceId)) {
          traces.set(traceId, {
            trace_id: traceId,
            span_count: 0,
            error_count: 0,
            events: [],
          });
        }

        const trace = traces.get(traceId)!;
        trace.events.push(event);

        // Update trace statistics
        if (event.type === "error") {
          trace.error_count++;
        }

        if (event.spans) {
          trace.span_count += event.spans.length;
        }

        // Set root transaction and timing info
        if (event.transaction && !trace.root_transaction) {
          trace.root_transaction = event.transaction;
        }

        // Use start_timestamp if available (for transactions), otherwise fall back to timestamp
        const eventStartTime = event.start_timestamp || event.timestamp;
        if (eventStartTime) {
          if (!trace.start_timestamp || eventStartTime < trace.start_timestamp) {
            trace.start_timestamp = eventStartTime;
          }
        }
      }
    } catch (err) {
      console.error("Error extracting trace events:", err);
    }
  }

  // Calculate durations and finalize traces
  for (const trace of traces.values()) {
    calculateTraceDuration(trace);
  }

  return traces;
}

/**
 * Extract trace-related events from a single envelope container
 */
function extractTraceEventsFromContainer(container: EventContainer): TraceEvent[] {
  const events: TraceEvent[] = [];

  try {
    const parsed = processEnvelope({
      contentType: container.getContentType(),
      data: container.getData(),
    });

    const [, items] = parsed!.envelope;

    for (const item of items) {
      const [{ type }, payload] = item;

      if (type === "event" && payload && typeof payload === "object") {
        const event = payload as any;

        // Only include events that have trace context
        if (event.contexts?.trace?.trace_id) {
          // Determine event type - error events have exception or level === "error"
          let eventType = "unknown";
          if (event.exception || event.level === "error") {
            eventType = "error";
          } else if (event.type) {
            eventType = event.type;
          }

          events.push({
            event_id: event.event_id || "",
            type: eventType,
            timestamp: event.timestamp,
            start_timestamp: event.start_timestamp,
            transaction: event.transaction,
            trace_context: event.contexts.trace,
            spans: event.spans,
            level: event.level,
            platform: event.platform,
            message: event.message,
            exception: event.exception,
          });
        }
      }

      // Handle transaction items
      if (type === "transaction" && payload && typeof payload === "object") {
        const transaction = payload as any;

        if (transaction.contexts?.trace?.trace_id) {
          events.push(convertPayloadToTraceEvent(transaction));
        }
      }
    }
  } catch (err) {
    console.error("Error parsing envelope for traces:", err);
  }

  return events;
}

/**
 * Calculate trace duration from start to latest event
 */
function calculateTraceDuration(trace: TraceSummary): void {
  if (!trace.start_timestamp) return;

  let latestTimestamp = trace.start_timestamp;

  for (const event of trace.events) {
    if (event.timestamp && event.timestamp > latestTimestamp) {
      latestTimestamp = event.timestamp;
    }

    // Also check span end times
    if (event.spans) {
      for (const span of event.spans) {
        if (span.timestamp && span.timestamp > latestTimestamp) {
          latestTimestamp = span.timestamp;
        }
      }
    }
  }

  trace.duration = getDuration(latestTimestamp, trace.start_timestamp);
}

/**
 * Build a hierarchical span tree from trace events
 */
export interface SpanNode {
  span_id: string;
  parent_span_id?: string;
  op?: string;
  description?: string;
  duration?: number;
  status?: string;
  is_transaction?: boolean;
  children: SpanNode[];
  level: number;
  event_id?: string;
}

export function buildSpanTree(trace: TraceSummary): SpanNode[] {
  const allSpans: SpanNode[] = [];
  const spanMap = new Map<string, SpanNode>();

  // Collect all spans from all events in the trace
  for (const event of trace.events) {
    // Add the transaction/event itself as a span node
    if (event.trace_context) {
      const eventSpan: SpanNode = {
        span_id: event.trace_context.span_id,
        parent_span_id: event.trace_context.parent_span_id,
        op: event.type === "transaction" ? "transaction" : event.type,
        description: event.transaction || event.message || "unnamed",
        is_transaction: event.type === "transaction" || !!event.transaction,
        children: [],
        level: 0,
        event_id: event.event_id,
        duration: getDuration(event.timestamp, event.start_timestamp),
      };

      allSpans.push(eventSpan);
      spanMap.set(eventSpan.span_id, eventSpan);
    }

    // Add individual spans from the event - but only if they're not duplicates
    if (event.spans && Array.isArray(event.spans)) {
      for (const span of event.spans) {
        // Skip if we already have this span
        if (spanMap.has(span.span_id)) continue;

        const spanNode: SpanNode = {
          span_id: span.span_id,
          parent_span_id: span.parent_span_id || event.trace_context?.span_id, // Default to event's span as parent
          op: span.op,
          description: span.description || "unnamed",
          duration: span.duration !== undefined ? span.duration : getDuration(span.timestamp, span.start_timestamp),
          status: span.status,
          children: [],
          level: 0,
        };

        allSpans.push(spanNode);
        spanMap.set(spanNode.span_id, spanNode);
      }
    }
  }

  // Build parent-child relationships
  const rootSpans: SpanNode[] = [];
  const orphanedByParentId = new Map<string, SpanNode[]>();

  // First pass: identify roots and orphans
  for (const span of allSpans) {
    if (!span.parent_span_id) {
      // No parent ID - it's a root
      rootSpans.push(span);
    } else if (spanMap.has(span.parent_span_id)) {
      // Parent exists - attach as child
      const parent = spanMap.get(span.parent_span_id)!;
      parent.children.push(span);
      span.level = parent.level + 1;
    } else {
      // Parent doesn't exist - it's an orphan
      // Group orphans by their missing parent ID
      if (!orphanedByParentId.has(span.parent_span_id)) {
        orphanedByParentId.set(span.parent_span_id, []);
      }
      orphanedByParentId.get(span.parent_span_id)!.push(span);
    }
  }

  // Helper function to recursively update levels
  function updateLevels(node: SpanNode, newLevel: number) {
    node.level = newLevel;
    for (const child of node.children) {
      updateLevels(child, newLevel + 1);
    }
  }

  // Create orphan parent spans for grouped orphans (like the UI does)
  for (const [parentId, orphans] of orphanedByParentId) {
    const orphanParent: SpanNode = {
      span_id: parentId,
      op: "orphan",
      description: "missing or unknown parent span",
      children: orphans,
      level: 0,
      is_transaction: false,
    };

    // Try to find a root to attach this orphan parent to
    const parentRoot = rootSpans.length === 1 ? rootSpans[0] : null;
    if (parentRoot) {
      parentRoot.children.push(orphanParent);
      // Update levels recursively relative to parent
      updateLevels(orphanParent, parentRoot.level + 1);
    } else {
      // No single root - add as a root itself
      rootSpans.push(orphanParent);
      // Update levels recursively for all children
      updateLevels(orphanParent, 0);
    }
  }

  // Sort children by start timestamp (like the UI) or duration
  for (const span of allSpans) {
    span.children.sort((a, b) => {
      // Sort by duration if available, otherwise by description
      if (a.duration !== undefined && b.duration !== undefined) {
        return b.duration - a.duration;
      }
      return 0;
    });
  }

  // If we have multiple roots, create a synthetic trace root
  if (rootSpans.length > 1) {
    const syntheticRoot: SpanNode = {
      span_id: trace.trace_id.substring(0, 16),
      description: `Trace ${trace.trace_id.substring(0, 8)}`,
      op: "trace",
      is_transaction: false,
      children: rootSpans.sort((a, b) => (b.duration || 0) - (a.duration || 0)),
      level: 0,
      duration: trace.duration,
    };
    // Update all root spans to be level 1 under synthetic root
    for (const root of rootSpans) {
      updateLevels(root, 1);
    }
    return [syntheticRoot];
  }

  return rootSpans;
}

/**
 * Format a transaction payload for CLI output
 */
export function formatTransactionEvent(event: SentryTransactionEvent): string[] {
  const traceEvent = convertPayloadToTraceEvent(event);
  return processTraceEvent(traceEvent);
}

/**
 * Format a trace/transaction event to markdown string
 */
export function formatTrace(payload: EnvelopeItem[1], _envelopeHeader: Envelope[0]): string[] {
  const event = payload as SentryTransactionEvent;
  return formatTransactionEvent(event);
}

/**
 * Convert a transaction payload to TraceEvent
 */
function convertPayloadToTraceEvent(payload: any): TraceEvent {
  return {
    event_id: payload.event_id || "",
    type: "transaction",
    timestamp: payload.timestamp,
    start_timestamp: payload.start_timestamp,
    transaction: payload.transaction,
    trace_context: payload.contexts.trace,
    spans: payload.spans,
    level: payload.level,
    platform: payload.platform,
  };
}

/**
 * Process a single trace event for CLI output
 */
export function processTraceEvent(event: TraceEvent): string[] {
  if (!event.trace_context?.trace_id) {
    return ["No trace context available"];
  }

  const trace: TraceSummary = {
    trace_id: event.trace_context.trace_id,
    root_transaction: event.transaction,
    start_timestamp: event.start_timestamp || event.timestamp,
    span_count: event.spans?.length || 0,
    error_count: 0,
    events: [event],
  };

  calculateTraceDuration(trace);

  const spanTree = buildSpanTree(trace);
  const lines = renderSpanTree(spanTree);

  return lines;
}

/**
 * Format trace summary for display
 */
export function formatTraceSummary(trace: TraceSummary): string {
  const duration = trace.duration ? `${Math.round(trace.duration)}ms` : "unknown";
  const transaction = trace.root_transaction || "unnamed";
  const timestamp = formatTimestamp(trace.start_timestamp);

  return `**${trace.trace_id.substring(0, 8)}** | ${transaction} | ${duration} | ${trace.span_count} spans | ${trace.error_count} errors | ${timestamp}`;
}

/**
 * Render span tree as hierarchical text
 */
export function renderSpanTree(spans: SpanNode[]): string[] {
  const lines: string[] = [];

  function formatSpanDisplayName(span: SpanNode): string {
    // For transaction spans, use the transaction name
    if (span.is_transaction) {
      return span.description || "unnamed transaction";
    }

    // For regular spans, use description or fallback to operation
    return span.description || span.op || "unnamed";
  }

  function renderSpan(span: SpanNode, prefix = "", isLast = true): void {
    const shortId = span.span_id.substring(0, 8);
    const connector = prefix === "" ? "" : isLast ? "└─ " : "├─ ";
    const displayName = formatSpanDisplayName(span);

    // Format similar to sentry-mcp
    if (span.is_transaction) {
      // For transactions, show without operation since it's redundant
      const duration = span.duration ? `${Math.round(span.duration)}ms` : "unknown";
      lines.push(`${prefix}${connector}${displayName} [${shortId} · ${duration}]`);
    } else {
      const duration = span.duration ? `${Math.round(span.duration)}ms` : "unknown";

      // Don't show 'default' or 'unknown' operations as they're not meaningful
      const opDisplay =
        span.op && span.op !== "default" && span.op !== "unknown" && span.op !== "transaction" ? ` · ${span.op}` : "";
      lines.push(`${prefix}${connector}${displayName} [${shortId}${opDisplay} · ${duration}]`);
    }

    // Render all children with proper tree indentation
    for (let i = 0; i < span.children.length; i++) {
      const child = span.children[i];
      const isLastChild = i === span.children.length - 1;
      const childPrefix = prefix + (isLast ? "   " : "│  ");
      renderSpan(child, childPrefix, isLastChild);
    }
  }

  // Render all root spans
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const isLastRoot = i === spans.length - 1;
    renderSpan(span, "", isLastRoot);
  }

  return lines;
}
