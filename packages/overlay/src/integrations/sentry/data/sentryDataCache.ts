import { Envelope } from '@sentry/types';
import { generate_uuidv4 } from '../../../lib/uuid';
import { Sdk, SentryErrorEvent, SentryEvent, SentryTransactionEvent, Span, Trace } from '../types';
import { groupSpans } from '../utils/traces';

function toTimestamp(date: string | number) {
  if (typeof date === 'string') return new Date(date).getTime();
  return date * 1000;
}

type OnlineSubscription = ['online', (status: boolean) => void];
type EventSubscription = ['event', (event: SentryEvent) => void];
type TraceSubscription = ['trace', (trace: Trace) => void];

type Subscription = OnlineSubscription | EventSubscription | TraceSubscription;

function sdkToPlatform(name: string) {
  if (name.indexOf('javascript') !== -1) return 'javascript';
  if (name.indexOf('python') !== -1) return 'python';
  if (name.indexOf('php') !== -1) return 'php';
  if (name.indexOf('ruby') !== -1) return 'ruby';
  return 'unknown';
}

class SentryDataCache {
  protected events: SentryEvent[] = [];
  protected sdks: Sdk[] = [];
  protected traces: Trace[] = [];
  protected tracesById: { [id: string]: Trace } = {};

  protected subscribers: Map<string, Subscription> = new Map();

  constructor(
    initial: (SentryEvent & {
      event_id?: string;
    })[] = [],
  ) {
    initial.forEach(e => this.pushEvent(e));
  }

  inferSdkFromEvent(event: SentryEvent) {
    const sdk: Sdk = {
      name: 'unknown',
      version: 'unknown',
      lastSeen: new Date().getTime(),
    };

    if (event.sdk) {
      sdk.name = event.sdk.name || sdk.name;
      sdk.version = event.sdk.version || sdk.version;
    } else if (event.platform) {
      sdk.name = event.platform;
    }

    return sdk;
  }

  pushEnvelope(envelope: Envelope) {
    const [header, items] = envelope;
    let sdk: Sdk;
    if (header.sdk && header.sdk.name && header.sdk.version) {
      sdk = {
        name: header.sdk.name,
        version: header.sdk.version,
        lastSeen: new Date(header.sent_at as string).getTime(),
      };
    } else {
      sdk = this.inferSdkFromEvent(items[0][1] as SentryEvent);
    }

    const existingSdk = this.sdks.find(s => s.name === sdk!.name && s.version === sdk!.version);
    if (!existingSdk) {
      this.sdks.push({
        name: sdk.name,
        version: sdk.version,
        lastSeen: new Date(header.sent_at as string).getTime(),
      });
    } else {
      existingSdk.lastSeen = new Date(header.sent_at as string).getTime();
    }

    items.forEach(([itemHeader, itemData]) => {
      if (itemHeader.type === 'event' || itemHeader.type === 'transaction') {
        (itemData as SentryEvent).platform = sdkToPlatform(sdk.name);
        this.pushEvent(itemData as SentryEvent);
      }
    });
  }

  pushEvent(
    event: SentryEvent & {
      event_id?: string;
    },
  ) {
    if (!event.event_id) {
      event.event_id = generate_uuidv4();
    }

    if (isErrorEvent(event)) {
      reverseStackTraces(event);
    }

    event.timestamp = toTimestamp(event.timestamp);
    if (event.start_timestamp) event.start_timestamp = toTimestamp(event.start_timestamp);

    this.events.push(event);

    const traceCtx = event.contexts?.trace;
    if (traceCtx) {
      const existingTrace = this.tracesById[traceCtx.trace_id];
      const startTs = event.start_timestamp ? event.start_timestamp : new Date().getTime();
      const trace = existingTrace ?? {
        ...traceCtx,
        spans: [] as Span[],
        transactions: [] as SentryTransactionEvent[],
        errors: 0,
        timestamp: event.timestamp,
        start_timestamp: startTs,
        status: traceCtx.status,
        rootTransactionName: event.transaction || '(unknown transaction)',
        rootTransaction: null,
      };

      if (event.type === 'transaction') {
        trace.transactions.push(event);
        trace.transactions.sort((a, b) => a.start_timestamp - b.start_timestamp);

        // recompute tree as we might have txn out of order
        // XXX: we're trusting timestamps, wihch are not trustworthy
        const allSpans: Span[] = [];
        trace.transactions.forEach(txn => {
          allSpans.push(
            {
              ...txn.contexts.trace,
              start_timestamp: txn.start_timestamp,
              timestamp: txn.timestamp,
              description: traceCtx.description || txn.transaction,
              transaction: txn,
            },
            ...txn.spans.map(s => ({
              ...s,
              timestamp: toTimestamp(s.timestamp),
              start_timestamp: toTimestamp(s.start_timestamp),
            })),
          );
        });
        trace.spans = allSpans;
        trace.spanTree = groupSpans(trace.spans);
      } else {
        trace.errors += 1;
      }
      trace.start_timestamp = Math.min(startTs, trace.start_timestamp);
      trace.timestamp = Math.max(event.timestamp, trace.timestamp);
      if (traceCtx.status !== 'ok') trace.status = traceCtx.status;

      const roots = trace.transactions.filter(e => !e.contexts.trace.parent_span_id);
      if (roots.length === 1) {
        trace.rootTransaction = roots[0];
        trace.rootTransactionName = roots[0].transaction || '(unknown transaction)';
      } else if (roots.length > 1) trace.rootTransactionName = '(multiple root transactions)';
      else trace.rootTransactionName = '(missing root transaction)';

      if (!existingTrace) {
        this.traces.unshift(trace);
        this.tracesById[trace.trace_id] = trace;
      }
      this.subscribers.forEach(([type, cb]) => type === 'trace' && cb(trace));
    }
    this.subscribers.forEach(([type, cb]) => type === 'event' && cb(event));
  }

  getEvents() {
    return [...this.events];
  }

  getTraces() {
    return [...this.traces];
  }

  getSdks() {
    return [...this.sdks];
  }

  getEventById(id: string) {
    return this.events.find(e => e.event_id === id);
  }

  getTraceById(id: string) {
    return this.tracesById[id];
  }

  getEventsByTrace(traceId: string, spanId?: string | null) {
    return this.events.filter(
      e => e.contexts?.trace?.trace_id === traceId && (!spanId || e.contexts?.trace?.span_id === spanId),
    );
  }

  getSpanById(traceId: string, spanId: string) {
    const trace = this.tracesById[traceId];
    if (!trace) return undefined;
    return trace.spans.find(s => s.span_id === spanId);
  }

  subscribe(...args: Subscription) {
    const id = generate_uuidv4();
    this.subscribers.set(id, args);

    return () => {
      this.subscribers.delete(id);
    };
  }
}

export default new SentryDataCache();

function isErrorEvent(event: SentryEvent): event is SentryErrorEvent {
  return !event.type;
}

function reverseStackTraces(errorEvent: SentryErrorEvent): void {
  if (!errorEvent.exception || !errorEvent.exception.values) {
    return;
  }
  errorEvent.exception.values.forEach(value => {
    if (value.stacktrace) {
      value.stacktrace.frames.reverse();
    }
  });
}
