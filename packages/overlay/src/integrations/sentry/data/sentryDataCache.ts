import { Envelope } from '@sentry/types';
import { CONTEXT_LINES_ENDPOINT } from '@spotlightjs/sidecar/constants';
import { DEFAULT_SIDECAR_URL } from '~/constants';
import { RawEventContext } from '~/integrations/integration';
import { log } from '../../../lib/logger';
import { generate_uuidv4 } from '../../../lib/uuid';
import { Sdk, SentryErrorEvent, SentryEvent, SentryTransactionEvent, Span, Trace } from '../types';
import { getNativeFetchImplementation } from '../utils/fetch';
import { sdkToPlatform } from '../utils/sdkToPlatform';
import { groupSpans } from '../utils/traces';

function toTimestamp(date: string | number) {
  if (typeof date === 'string') return new Date(date).getTime();
  return date * 1000;
}

type OnlineSubscription = ['online', (status: boolean) => void];
type EventSubscription = ['event', (event: SentryEvent) => void];
type TraceSubscription = ['trace', (trace: Trace) => void];

type Subscription = OnlineSubscription | EventSubscription | TraceSubscription;

class SentryDataCache {
  protected events: SentryEvent[] = [];
  protected eventIds: Set<string> = new Set<string>();
  protected sdks: Sdk[] = [];
  protected traces: Trace[] = [];
  protected tracesById: { [id: string]: Trace } = {};
  protected localTraceIds: Set<string> = new Set<string>();
  protected envelopes: {
    envelope: Envelope;
    rawEnvelope: RawEventContext;
  }[] = [];

  protected subscribers: Map<string, Subscription> = new Map();

  protected contextLinesProvider: string | null = new URL(DEFAULT_SIDECAR_URL).origin + CONTEXT_LINES_ENDPOINT;

  constructor(
    initial: (SentryEvent & {
      event_id?: string;
    })[] = [],
  ) {
    initial.forEach(e => this.pushEvent(e));
  }

  setSidecarUrl(url: string | null) {
    if (!url) {
      this.contextLinesProvider = null;
      return;
    }

    const { origin } = new URL(url);
    this.contextLinesProvider = origin + CONTEXT_LINES_ENDPOINT;
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

  pushEnvelope({ envelope, rawEnvelope }: { envelope: Envelope; rawEnvelope: RawEventContext }): number {
    const [header, items] = envelope;
    const lastSeen = new Date(header.sent_at as string).getTime();
    let sdk: Sdk;

    if (header.sdk && header.sdk.name && header.sdk.version) {
      sdk = {
        name: header.sdk.name,
        version: header.sdk.version,
        lastSeen: lastSeen,
      };
    } else if (items.length > 0) {
      sdk = this.inferSdkFromEvent(items[0][1] as SentryEvent);
    } else {
      sdk = {
        name: 'unknown',
        version: '0.0.0',
        lastSeen,
      };
    }

    const existingSdk = this.sdks.find(s => s.name === sdk.name && s.version === sdk.version);
    if (existingSdk) {
      existingSdk.lastSeen = lastSeen;
    } else {
      this.sdks.push({
        name: sdk.name,
        version: sdk.version,
        lastSeen,
      });
    }

    for (const [itemHeader, itemData] of items) {
      if (itemHeader.type === 'event' || itemHeader.type === 'transaction') {
        (itemData as SentryEvent).platform = sdkToPlatform(sdk.name);
        // The below is an async function but we really don't need to wait for that
        this.pushEvent(itemData as SentryEvent);
      }
    }

    return this.envelopes.push({ envelope, rawEnvelope });
  }

  async pushEvent(
    event: SentryEvent & {
      event_id?: string;
    },
  ) {
    if (!event.event_id) {
      event.event_id = generate_uuidv4();
    }

    if (this.eventIds.has(event.event_id)) return;

    if (isErrorEvent(event)) {
      await this.processStacktrace(event);
    }

    event.timestamp = toTimestamp(event.timestamp);
    if (event.start_timestamp) event.start_timestamp = toTimestamp(event.start_timestamp);

    const traceCtx = event.contexts?.trace;

    this.events.push(event);

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
        // XXX: we're trusting timestamps, which are not trustworthy
        const allSpans: Span[] = [];
        trace.transactions.forEach(txn => {
          allSpans.push({
            ...txn.contexts.trace,
            tags: txn?.tags,
            start_timestamp: txn.start_timestamp,
            timestamp: txn.timestamp,
            description: traceCtx.description || txn.transaction,
            transaction: txn,
          });

          if (txn.spans) {
            allSpans.push(
              ...txn.spans.map(s => ({
                ...s,
                timestamp: toTimestamp(s.timestamp),
                start_timestamp: toTimestamp(s.start_timestamp),
              })),
            );
          }
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
    this.eventIds.add(event.event_id);
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

  getEnvelopes() {
    return [...this.envelopes];
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

  resetData() {
    this.envelopes = [];
    this.events = [];
    this.eventIds = new Set<string>();
    this.traces = [];
    this.tracesById = {};
    this.localTraceIds = new Set<string>();
  }

  subscribe(...args: Subscription) {
    const id = generate_uuidv4();
    this.subscribers.set(id, args);

    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Mark a traceId as being seen in the local session.
   *
   * @param traceId
   */
  trackLocalTrace(traceId: string) {
    this.localTraceIds.add(traceId);
  }

  /**
   * Determine if a traceId was seen in the local session.
   *
   * A result of `null` means "unknown", which implies there is no known
   * information about any session-initiated traces.
   */
  isTraceLocal(traceId: string): boolean | null {
    if (this.localTraceIds.has(traceId)) return true;
    if (this.localTraceIds.size > 0) return false;
    return null;
  }

  /**
   * Reverses the stack trace and tries to fill missing context lines
   * @param errorEvent
   * @returns
   */
  async processStacktrace(errorEvent: SentryErrorEvent): Promise<void[]> {
    if (!errorEvent.exception || !errorEvent.exception.values) {
      return [];
    }

    return Promise.all(
      (errorEvent.exception.values ?? []).map(async exception => {
        if (
          !exception.stacktrace ||
          exception.stacktrace.frames?.every(frame => frame.post_context && frame.pre_context && frame.context_line)
        ) {
          log('Skipping contextlines request for', exception);
          return;
        }
        exception.stacktrace.frames.reverse();

        if (this.contextLinesProvider) {
          try {
            const makeFetch = getNativeFetchImplementation();
            const stackTraceWithContextResponse = await makeFetch(this.contextLinesProvider, {
              method: 'PUT',
              body: JSON.stringify(exception.stacktrace),
            });

            if (!stackTraceWithContextResponse.ok || stackTraceWithContextResponse.status !== 200) {
              return;
            }

            const stackTraceWithContext = await stackTraceWithContextResponse.json();
            exception.stacktrace = stackTraceWithContext;
          } catch {
            // Something went wrong, for now we just ignore it.
          }
        }
      }),
    );
  }
}

export default new SentryDataCache();

function isErrorEvent(event: SentryEvent): event is SentryErrorEvent {
  return event.type != 'transaction';
}
