import type { Envelope } from "@sentry/core";
import { createEngine } from "./internal/engine.ts";
import { normalizeEnvelope, supportsEnvelope, validateEnvelope } from "./internal/envelopes.ts";
import { readonlyCopy } from "./internal/readonly.ts";
import type {
  Diagnostic,
  EventFilter,
  IngestResult,
  Ingester,
  IngesterOptions,
  IngesterSnapshot,
  TraceFilter,
} from "./public.ts";
import {
  getAITraces,
  getProfileFunctionSummaries,
  getQuerySummaries,
  getResourceSummaries,
  getSpans,
  getWebVitals,
} from "./selectors/index.ts";
import { normalizeSpanItem } from "./store/utils/spanProcessor.ts";
import type { SentryErrorEvent, SentryEvent, Trace } from "./types.ts";
import { isErrorEvent } from "./utils/sentry.ts";
import { generateUuidv4 } from "./uuid.ts";

type RetainedEnvelope = { id: string; envelope: Envelope; receivedAtMs: number };

/** Portable, independently owned telemetry with immutable committed reads. */
export function createIngester(options: IngesterOptions = {}): Ingester {
  const maxEnvelopes = options.retention?.maxEnvelopes ?? 500;
  const maxAgeMs = options.retention?.maxAgeMs;
  if (!Number.isSafeInteger(maxEnvelopes) || maxEnvelopes < 1)
    throw new RangeError("retention.maxEnvelopes must be a positive safe integer");
  if (maxAgeMs !== undefined && (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0))
    throw new RangeError("retention.maxAgeMs must be a positive finite number");
  let generation = 0;
  let disposed = false;
  let revision = 0;
  let queue: Promise<unknown> = Promise.resolve();
  let journal: RetainedEnvelope[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const identities = new WeakMap<object, string>();
  const listeners = new Set<(snapshot: IngesterSnapshot) => void>();
  let enrichmentCache = new Map<string, { envelopeId: string; exception: SentryErrorEvent["exception"] }>();
  let currentDiagnostics: Diagnostic[] = [];
  function diagnostic(item: Diagnostic) {
    currentDiagnostics.push(item);
    try {
      options.onDiagnostic?.(item);
    } catch {
      /* Diagnostic observers cannot break capture. */
    }
  }
  function makeEngine() {
    const cache = enrichmentCache;
    const epoch = generation;
    let currentEnvelopeId = "";
    const created = createEngine({
      enrichStacktrace: async event => {
        const envelopeId = currentEnvelopeId;
        const cached = cache.get(event.event_id);
        if (cached?.envelopeId === envelopeId) {
          event.exception = structuredClone(cached.exception);
          return;
        }
        try {
          await options.enrichStacktrace?.(event);
        } catch {
          if (active(epoch) && created.runtime.generation === 0)
            diagnostic({
              code: "enrichment_failed",
              message: "Stacktrace enrichment failed; captured telemetry was retained.",
            });
        }
        if (active(epoch) && created.runtime.generation === 0)
          cache.set(event.event_id, { envelopeId, exception: structuredClone(event.exception) });
      },
    });
    return {
      ...created,
      ingestEnvelope(envelope: Envelope, receivedAtMs: number) {
        currentEnvelopeId = String(envelope[0].__spotlight_envelope_id);
        created.runtime.receivedAtMs = receivedAtMs;
        return created.store.getState().ingestEnvelope(envelope);
      },
    };
  }
  function invalid(code: string, message: string): IngestResult {
    const item = { code, message };
    try {
      options.onDiagnostic?.(item);
    } catch {
      /* Diagnostic observers do not break ingestion. */
    }
    return readonlyCopy({ status: "invalid" as const, diagnostics: [item] });
  }
  let engine = makeEngine();
  function stateSnapshot(): IngesterSnapshot {
    const state = engine.store.getState();
    return readonlyCopy({
      revision,
      envelopes: state.getEnvelopes(),
      events: state.getEvents(),
      traces: state.getTraces(),
      logs: state.getLogs(),
      sdks: state.getSdks(),
      profiles: state.profilesByTraceId,
    });
  }
  let snapshot = stateSnapshot();
  function publish() {
    revision++;
    snapshot = stateSnapshot();
    const committed = snapshot;
    for (const listener of listeners) {
      try {
        listener(committed);
      } catch {
        diagnostic({ code: "subscriber_failed", message: "A telemetry subscription callback failed." });
      }
      if (snapshot !== committed) break;
    }
  }
  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }
  function scheduleExpiry() {
    clearTimer();
    if (disposed || maxAgeMs === undefined || !journal.length) return;
    const delay = Math.max(1, Math.min(2147483647, journal[0].receivedAtMs + maxAgeMs - Date.now()));
    timer = setTimeout(() => {
      timer = undefined;
      void client.prune();
    }, delay);
    if (typeof timer === "object" && timer && "unref" in timer) timer.unref();
  }
  function enqueue<T>(task: (epoch: number) => Promise<T>): Promise<T> {
    const epoch = generation;
    const next = queue.then(() => task(epoch));
    queue = next.catch(() => {});
    return next;
  }
  function ignored(reason: string, envelopeId?: string): IngestResult {
    return readonlyCopy({ status: "ignored" as const, reason, ...(envelopeId ? { envelopeId } : {}), diagnostics: [] });
  }
  function active(epoch: number) {
    return !disposed && epoch === generation;
  }
  async function rebuild(retained: RetainedEnvelope[], epoch: number) {
    const replacement = makeEngine();
    for (const record of retained) {
      await replacement.ingestEnvelope(record.envelope, record.receivedAtMs);
      if (!active(epoch)) return;
    }
    engine = replacement;
    const eventIds = engine.store.getState().eventsById;
    for (const key of enrichmentCache.keys()) if (!eventIds.has(key)) enrichmentCache.delete(key);
  }
  async function enforceRetention(epoch: number): Promise<boolean> {
    const cutoff = maxAgeMs === undefined ? Number.NEGATIVE_INFINITY : Date.now() - maxAgeMs;
    const retained = journal.filter(record => record.receivedAtMs > cutoff).slice(-maxEnvelopes);
    if (retained.length === journal.length) return false;
    await rebuild(retained, epoch);
    if (!active(epoch)) return false;
    journal = retained;
    return true;
  }
  function filterEvents(filter?: EventFilter) {
    return snapshot.events.filter(
      event =>
        (filter?.traceId === undefined || event.contexts?.trace?.trace_id === filter.traceId) &&
        (filter?.spanId === undefined || event.contexts?.trace?.span_id === filter.spanId),
    );
  }
  function filteredTraces(filter?: TraceFilter) {
    return snapshot.traces.filter(trace => filter?.traceId === undefined || trace.trace_id === filter.traceId);
  }
  const client: Ingester = {
    ingestEnvelope: input => {
      if (disposed) return Promise.resolve(ignored("disposed"));
      if (!validateEnvelope(input))
        return Promise.resolve(
          invalid("invalid_envelope", "Expected a parsed envelope [headers, [[itemHeaders, payload], ...]]."),
        );
      const supported = supportsEnvelope(input);
      const inputDiagnostics: Diagnostic[] = [];
      let validSpans = 0;
      let invalidSpans = 0;
      let otherItems = false;
      for (const [header, payload] of input[1]) {
        if (header.type !== "span") {
          otherItems = true;
          continue;
        }
        const data = payload as Record<string, unknown>;
        if ("items" in data && data.version !== 2) continue;
        const count = Array.isArray(data.items) ? data.items.length : 1;
        const valid = normalizeSpanItem(data, { name: "unknown", version: "unknown", lastSeen: 0 }).length;
        validSpans += valid;
        invalidSpans += count - valid;
      }
      if (invalidSpans > 0) {
        if (validSpans === 0 && !otherItems)
          return Promise.resolve(invalid("invalid_span", "Span items are missing valid IDs or timestamps."));
        inputDiagnostics.push({
          code: "invalid_span",
          message: "Malformed span items were skipped; valid telemetry was retained.",
        });
      }
      let id: string;
      let envelope: Envelope;
      try {
        id = String(input[0].__spotlight_envelope_id ?? identities.get(input) ?? generateUuidv4());
        identities.set(input, id);
        envelope = normalizeEnvelope(input);
        envelope[0].__spotlight_envelope_id = id;
      } catch {
        return Promise.resolve(invalid("invalid_envelope", "Envelope data must be cloneable wire data."));
      }
      const receivedAtMs = Date.now();
      return enqueue(async epoch => {
        if (!active(epoch)) return ignored(disposed ? "disposed" : "reset", id);
        currentDiagnostics = [];
        for (const item of inputDiagnostics) diagnostic(item);
        const evicted = await enforceRetention(epoch);
        if (!active(epoch)) return ignored(disposed ? "disposed" : "reset", id);
        if (journal.some(record => record.id === id)) {
          if (evicted) publish();
          scheduleExpiry();
          return ignored("duplicate", id);
        }
        const working = engine;
        try {
          await working.ingestEnvelope(envelope, receivedAtMs);
        } catch {
          working.store.getState().resetData();
          if (!active(epoch)) return ignored(disposed ? "disposed" : "reset", id);
          await rebuild(journal, epoch);
          if (active(epoch)) {
            if (evicted) publish();
            scheduleExpiry();
          }
          return invalid("invalid_envelope", "Envelope telemetry could not be processed.");
        }
        if (!active(epoch)) return ignored(disposed ? "disposed" : "reset", id);
        journal.push({ id, envelope, receivedAtMs });
        await enforceRetention(epoch);
        if (!active(epoch)) return ignored(disposed ? "disposed" : "reset", id);
        publish();
        scheduleExpiry();
        return supported
          ? readonlyCopy({ status: "processed" as const, envelopeId: id, diagnostics: currentDiagnostics })
          : readonlyCopy({
              status: "ignored" as const,
              reason: "unsupported_items",
              envelopeId: id,
              diagnostics: currentDiagnostics,
            });
      });
    },
    getSnapshot: () => snapshot,
    getEnvelope: id => snapshot.envelopes.find(envelope => String(envelope[0].__spotlight_envelope_id) === id),
    getEnvelopes: () => snapshot.envelopes,
    getEvent: id => snapshot.events.find(event => event.event_id === id),
    getEvents: filter => (filter ? Object.freeze(filterEvents(filter)) : snapshot.events),
    getErrors: filter =>
      Object.freeze(filterEvents(filter).filter(event => isErrorEvent(event as SentryEvent))) as ReturnType<
        Ingester["getErrors"]
      >,
    getTrace: id => snapshot.traces.find(trace => trace.trace_id === id),
    getTraces: filter => (filter ? Object.freeze(filteredTraces(filter)) : snapshot.traces),
    getSpans: filter => Object.freeze(getSpans(filteredTraces(filter) as Trace[])) as ReturnType<Ingester["getSpans"]>,
    getLog: id => snapshot.logs.find(log => log.id === id),
    getLogs: filter =>
      filter?.traceId === undefined
        ? snapshot.logs
        : Object.freeze(snapshot.logs.filter(log => log.trace_id === filter.traceId)),
    getProfile: id => snapshot.profiles.get(id),
    getProfileFunctionSummaries: filter =>
      readonlyCopy(
        getProfileFunctionSummaries(
          snapshot.profiles as unknown as Parameters<typeof getProfileFunctionSummaries>[0],
          filter,
        ),
      ),
    getQuerySummaries: filter =>
      readonlyCopy(
        getQuerySummaries(getSpans(filteredTraces(filter) as Trace[]), { description: filter?.description }),
      ),
    getResourceSummaries: filter => readonlyCopy(getResourceSummaries(getSpans(filteredTraces(filter) as Trace[]))),
    getAITraces: filter => readonlyCopy(getAITraces(filteredTraces(filter) as Trace[])),
    getWebVitals: () => readonlyCopy(getWebVitals(snapshot.events as SentryEvent[])),
    getSdks: () => snapshot.sdks,
    subscribe: listener => {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset: () => {
      if (disposed) return;
      generation++;
      clearTimer();
      engine.store.getState().resetData();
      journal = [];
      enrichmentCache = new Map();
      engine = makeEngine();
      queue = Promise.resolve();
      publish();
    },
    prune: () =>
      enqueue(async epoch => {
        if (!active(epoch)) return;
        if (await enforceRetention(epoch)) {
          if (active(epoch)) publish();
        }
        scheduleExpiry();
      }),
    dispose: () => {
      if (disposed) return;
      generation++;
      disposed = true;
      clearTimer();
      engine.store.getState().resetData();
      journal = [];
      enrichmentCache.clear();
      listeners.clear();
      engine = makeEngine();
      revision++;
      snapshot = stateSnapshot();
      queue = Promise.resolve();
    },
  };
  return client;
}

export type { Ingester, IngesterOptions, IngesterSnapshot, IngestResult, Diagnostic } from "./public.ts";
