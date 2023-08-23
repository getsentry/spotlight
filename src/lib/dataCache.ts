import { SentryEvent, SentryTransactionEvent, Span, Trace } from "~/types";
import { groupSpans } from "./traces";

function generate_uuidv4() {
  let dt = new Date().getTime();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let rnd = Math.random() * 16; //random number in range 0 to 16
    rnd = (dt + rnd) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === "x" ? rnd : (rnd & 0x3) | 0x8).toString(16);
  });
}

function toTimestamp(date: string | number) {
  if (typeof date === "string") return new Date(date).getTime();
  return date * 1000;
}

type SubscriptionCallback = (event: SentryEvent) => void;

class DataCache {
  protected events: SentryEvent[];
  private traces: Trace[];
  private tracesById: { [id: string]: Trace };
  protected subscribers: Map<string, SubscriptionCallback>;

  constructor(
    initial: (SentryEvent & {
      event_id?: string;
    })[] = []
  ) {
    this.events = [];
    this.traces = [];
    this.tracesById = {};
    this.subscribers = new Map<string, SubscriptionCallback>();

    initial.forEach((e) => this.pushEvent(e));
  }

  pushEvent(
    event: SentryEvent & {
      event_id?: string;
    }
  ) {
    if (!event.event_id) event.event_id = generate_uuidv4();

    event.timestamp = toTimestamp(event.timestamp);
    if (event.start_timestamp)
      event.start_timestamp = toTimestamp(event.start_timestamp);

    const traceCtx = event.contexts?.trace;
    if (traceCtx) {
      const existingTrace = this.tracesById[traceCtx.trace_id];
      const startTs = event.start_timestamp
        ? event.start_timestamp
        : new Date().getTime();
      const trace = existingTrace ?? {
        ...traceCtx,
        spans: [] as Span[],
        transactions: [] as SentryTransactionEvent[],
        errors: 0,
        timestamp: event.timestamp,
        start_timestamp: startTs,
        status: traceCtx.status,
        rootTransactionName: event.transaction || "(unknown transaction)",
        rootTransaction: null,
      };

      if (event.type === "transaction") {
        [
          {
            ...traceCtx,
            start_timestamp: event.start_timestamp,
            timestamp: event.timestamp,
            description: traceCtx.description || event.transaction,
            transaction: event,
          },
          ...event.spans,
        ].forEach((s) => trace.spans.push(s));
        trace.spanTree = groupSpans(trace.spans);
        trace.transactions.push(event);
      } else {
        trace.errors += 1;
      }
      trace.start_timestamp = Math.min(startTs, trace.start_timestamp);
      trace.timestamp = Math.max(event.timestamp, trace.timestamp);
      if (traceCtx.status !== "ok") trace.status = traceCtx.status;

      const roots = trace.transactions.filter(
        (e) => !e.contexts.trace.parent_span_id
      );
      if (roots.length === 1) {
        trace.rootTransaction = roots[0];
        trace.rootTransactionName =
          roots[0].transaction || "(unknown transaction)";
      } else if (roots.length > 1)
        trace.rootTransactionName = "(multiple root transactions)";
      else trace.rootTransactionName = "(missing root transaction)";

      if (!existingTrace) {
        this.traces.unshift(trace);
        this.tracesById[trace.trace_id] = trace;
      }
    }

    this.events.push(event);
    this.subscribers.forEach((s) => s(event));
  }

  getEvents() {
    return [...this.events];
  }

  getTraces() {
    return [...this.traces];
  }

  getEventById(id: string) {
    return this.events.find((e) => e.event_id === id);
  }

  getTraceById(id: string) {
    return this.tracesById[id];
  }

  getEventsByTrace(traceId: string, spanId?: string | null) {
    return this.events.filter(
      (e) =>
        e.contexts?.trace?.trace_id === traceId &&
        (!spanId || e.contexts?.trace?.span_id === spanId)
    );
  }

  getSpanById(traceId: string, spanId: string) {
    const trace = this.tracesById[traceId];
    if (!trace) return undefined;
    return trace.spans.find((s) => s.span_id === spanId);
  }

  subscribe(cb: SubscriptionCallback) {
    const id = generate_uuidv4();
    this.subscribers.set(id, cb);

    return () => {
      this.subscribers.delete(id);
    };
  }
}

export default new DataCache();
