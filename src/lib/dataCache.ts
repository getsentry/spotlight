import { SentryEvent, Trace } from "~/types";

function generate_uuidv4() {
  let dt = new Date().getTime();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let rnd = Math.random() * 16; //random number in range 0 to 16
    rnd = (dt + rnd) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === "x" ? rnd : (rnd & 0x3) | 0x8).toString(16);
  });
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
    this.events.push(event);

    const traceCtx = event.contexts?.trace;
    if (traceCtx) {
      const existingTrace = this.tracesById[traceCtx.trace_id];
      const startTs = event.start_timestamp
        ? new Date(event.start_timestamp).getTime()
        : new Date().getTime();
      const endTs = new Date(event.timestamp).getTime();
      const trace = existingTrace ?? {
        ...traceCtx,
        spans: [] as Span[],
        transactions: [] as SentryTransactionEvent[],
        errors: 0,
        timestamp: endTs,
        start_timestamp: startTs,
        status: traceCtx.status,
        rootTransactionName: event.transaction || "(unknown transaction)",
        rootTransaction: null,
      };

      if (event.type === "transaction") {
        trace.spans.push({
          ...traceCtx,
          start_timestamp: event.start_timestamp,
          timestamp: event.timestamp,
          description: traceCtx.description || event.transaction,
          event,
        });
        event.spans.forEach((s) => trace.spans.push(s));
        trace.transactions.push(event);
      } else {
        // TODO: inject event reference in span tree?
        const refSpan = trace.spans.find(
          (s) =>
            traceCtx.trace_id === s.trace_id && traceCtx.span_id === s.span_id
        );
        if (refSpan) refSpan.event = event;
        trace.errors += 1;
      }
      trace.start_timestamp = Math.min(startTs, trace.start_timestamp);
      trace.timestamp = Math.max(endTs, trace.timestamp);
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
        this.traces.push(trace);
        this.tracesById[trace.trace_id] = trace;
      }
    }

    this.subscribers.forEach((s) => s(event));
  }

  getEvents() {
    return [...this.events];
  }

  getTraces() {
    return [...this.traces];
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
