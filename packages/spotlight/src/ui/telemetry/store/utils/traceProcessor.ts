import { graftProfileSpans } from "../../data/profiles";
import type { SentryTransactionEvent, Span, Trace } from "../../types";
import { compareSpans, groupSpans } from "../../utils/traces";
import type { SentryProfileWithTraceMeta } from "../types";
import { toTimestamp } from "../utils";
import type { ProcessedProfileChunk } from "./profileChunkProcessor";
import { mergeChunksToProfile } from "./profileChunkProcessor";

export interface TraceProcessingContext {
  existingTrace?: Trace;
  profilesByTraceId: Map<string, SentryProfileWithTraceMeta>;
  profileChunksByProfilerId?: Map<string, ProcessedProfileChunk[]>;
}

export interface TraceProcessingResult {
  trace: Trace;
  shouldUpdateTrace: boolean;
  /** V2 profile merged from chunks, to be stored in profilesByTraceId */
  mergedProfile?: SentryProfileWithTraceMeta;
}

/**
 * Processes a transaction event and updates the trace data structure.
 * Handles span tree construction, profile grafting, and trace metadata.
 */
export function processTransactionEvent(
  event: SentryTransactionEvent,
  context: TraceProcessingContext,
): TraceProcessingResult {
  const traceCtx = event.contexts.trace;
  const { existingTrace, profilesByTraceId, profileChunksByProfilerId } = context;

  // Add guard to ensure trace_id exists
  if (!traceCtx.trace_id) {
    throw new Error("Transaction event missing required trace_id");
  }

  // Initialize or get existing trace
  const trace: Trace = existingTrace ?? {
    ...traceCtx,
    trace_id: traceCtx.trace_id,
    spans: new Map(),
    spanTree: [] as Span[],
    transactions: [] as SentryTransactionEvent[],
    errors: 0,
    start_timestamp: event.start_timestamp ?? event.timestamp,
    timestamp: event.timestamp,
    status: traceCtx.status,
    rootTransactionName: event.transaction || "(unknown transaction)",
    rootTransaction: null,
    profileGrafted: false,
  };

  // Update trace timestamps
  trace.start_timestamp = Math.min(event.start_timestamp ?? event.timestamp, trace.start_timestamp);
  trace.timestamp = Math.max(event.timestamp, trace.timestamp);

  // Add transaction and rebuild span tree
  trace.transactions.push(event);
  trace.transactions.sort(compareSpans);

  // Recompute span map from all transactions
  const spanMap: Map<string, Span> = new Map();
  for (const txn of trace.transactions) {
    const txnTrace = txn.contexts.trace;
    if (!txnTrace || !txnTrace.span_id || !txnTrace.trace_id) {
      continue;
    }

    spanMap.set(txnTrace.span_id, {
      ...txnTrace,
      span_id: txnTrace.span_id,
      trace_id: txnTrace.trace_id,
      tags: txn?.tags,
      start_timestamp: txn.start_timestamp,
      timestamp: txn.timestamp,
      description: traceCtx.description || txn.transaction,
      transaction: txn,
    });

    // Add child spans
    if (txn.spans) {
      for (const span of txn.spans) {
        spanMap.set(span.span_id, {
          ...span,
          timestamp: toTimestamp(span.timestamp),
          start_timestamp: toTimestamp(span.start_timestamp),
        });
      }
    }
  }

  trace.spans = spanMap;
  trace.spanTree = groupSpans(trace.spans);

  // Graft profile data if available (V1 profiles keyed by trace_id)
  const profileForTrace = profilesByTraceId.get(trace.trace_id);
  if (profileForTrace) {
    graftProfileSpans(trace, profileForTrace);
  }

  // Try V2 continuous profiling: look for profiler_id in transaction context
  // V2 uses contexts.profile.profiler_id to link profiles
  let mergedProfile: SentryProfileWithTraceMeta | undefined;
  if (!trace.profileGrafted && profileChunksByProfilerId) {
    const profileContext = event.contexts?.profile as { profiler_id?: string } | undefined;
    const profilerId = profileContext?.profiler_id;

    if (profilerId) {
      const chunks = profileChunksByProfilerId.get(profilerId);
      if (chunks && chunks.length > 0) {
        // Get the active thread ID from trace context data if available
        const activeThreadId = traceCtx.data?.["thread.id"] as string | undefined;
        mergedProfile = mergeChunksToProfile(chunks, activeThreadId) ?? undefined;
        if (mergedProfile) {
          graftProfileSpans(trace, mergedProfile);
        }
      }
    }
  }

  return {
    trace,
    shouldUpdateTrace: true,
    mergedProfile,
  };
}

/**
 * Updates trace metadata based on its transactions.
 * Determines root transaction and handles orphan traces.
 */
export function updateTraceMetadata(trace: Trace): void {
  const roots = trace.transactions.filter(e => !e.contexts.trace.parent_span_id);

  if (roots.length === 1) {
    trace.rootTransaction = roots[0];
    trace.rootTransactionName = roots[0].transaction || "(unknown transaction)";
  } else if (roots.length > 1) {
    trace.rootTransactionName = "(multiple root transactions)";
  } else if (trace.transactions.length > 0) {
    // Orphan trace: no root transaction, but has child transactions
    console.debug(
      `[Spotlight] Orphan trace detected (trace_id: ${trace.trace_id}). ` +
        `Using first transaction "${trace.transactions[0].transaction}" as fallback.`,
    );
    // use the first transcation for orphan traces
    trace.rootTransaction = trace.transactions[0];
    trace.rootTransactionName = trace.transactions[0].transaction || "(orphan transaction)";
  } else {
    trace.rootTransactionName = "(missing root transaction)";
  }
}
