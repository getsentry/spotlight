import type { Envelope } from '@sentry/core';
import { CONTEXT_LINES_ENDPOINT } from '@spotlightjs/sidecar/constants';
import { DEFAULT_SIDECAR_URL } from '../../../constants';
import { log } from '../../../lib/logger';
import { generateUuidv4 } from '../../../lib/uuid';
import type { RawEventContext } from '../../integration';
import type {
  FunctionProfile,
  Sdk,
  SentryErrorEvent,
  SentryEvent,
  SentryProcessedProfile,
  SentryProfileV1Event,
  SentryTransactionEvent,
  Span,
  Trace,
} from '../types';
import { getNativeFetchImplementation } from '../utils/fetch';
import { sdkToPlatform } from '../utils/sdkToPlatform';
import { compareSpans, groupSpans } from '../utils/traces';
import { graftProfileSpans } from './profiles';

function toTimestamp(date: string | number) {
  if (typeof date === 'string') return new Date(date).getTime();
  return date * 1000;
}

function relativeNsToTimestamp(startTs: number, ns: number | string) {
  const nsStr = ns.toString();
  return nsStr.length > 3 ? startTs + Number.parseInt(nsStr.slice(0, -3), 10) / 1000 : startTs;
}

// 'event' really is 'error' here but ＼（〇_ｏ）／

const ERROR_EVENT_TYPES = new Set(['event', 'error']);
// Enable 'span' type  later on. See https://github.com/getsentry/spotlight/issues/721
const TRACE_EVENT_TYPES = new Set(['transaction' /*, 'span'*/]);
const PROFILE_EVENT_TYPES = new Set(['profile']);
const SUPPORTED_EVENT_TYPES = new Set([...ERROR_EVENT_TYPES, ...TRACE_EVENT_TYPES, ...PROFILE_EVENT_TYPES]);

type OnlineSubscription = ['online', (status: boolean) => void];
type EventSubscription = ['event', (event: SentryEvent) => void];
type TraceSubscription = ['trace', (trace: Trace) => void];

type Subscription = OnlineSubscription | EventSubscription | TraceSubscription;

export type SentryProfileWithTraceMeta = SentryProcessedProfile & {
  timestamp: number;
  active_thread_id: string;
};

class SentryDataCache {
  protected events: SentryEvent[] = [];
  protected eventIds: Set<string> = new Set<string>();
  protected sdks: Sdk[] = [];
  protected traces: Trace[] = [];
  protected tracesById: Map<string, Trace> = new Map();
  protected profilesByTraceId: Map<string, SentryProfileWithTraceMeta> = new Map();
  protected localTraceIds: Set<string> = new Set<string>();
  protected envelopes: {
    envelope: Envelope;
    rawEnvelope: RawEventContext;
  }[] = [];

  protected subscribers: Map<string, Subscription> = new Map();

  protected contextLinesProvider: string = new URL(CONTEXT_LINES_ENDPOINT, DEFAULT_SIDECAR_URL).href;

  constructor(
    initial: (SentryEvent & {
      event_id?: string;
    })[] = [],
  ) {
    for (const evt of initial) {
      this.pushEvent(evt);
    }
  }

  setSidecarUrl(url: string) {
    const { href: contextLinesProviderUrl } = new URL(CONTEXT_LINES_ENDPOINT, url);
    this.contextLinesProvider = contextLinesProviderUrl;
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

    if (header.sdk?.name && header.sdk.version) {
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

    const traceContext = header.trace;

    for (const [itemHeader, itemData] of items) {
      if (SUPPORTED_EVENT_TYPES.has(itemHeader.type)) {
        const item = itemData as SentryEvent;
        item.platform = sdkToPlatform(sdk.name);
        if (traceContext) {
          if (!item.contexts) {
            item.contexts = {};
          }
          item.contexts.trace ??= traceContext;
        }
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
      event.event_id = generateUuidv4();
    }

    if (this.eventIds.has(event.event_id)) return;
    this.eventIds.add(event.event_id);

    if (isErrorEvent(event)) {
      await this.processStacktrace(event);
    }

    event.timestamp = toTimestamp(event.timestamp);
    if (event.start_timestamp) {
      event.start_timestamp = toTimestamp(event.start_timestamp);
    }

    const traceCtx = event.contexts?.trace;

    this.events.push(event);

    if (traceCtx?.trace_id) {
      const existingTrace = this.tracesById.get(traceCtx.trace_id);
      const trace = existingTrace ?? {
        ...traceCtx,
        trace_id: traceCtx.trace_id,
        spans: new Map(),
        spanTree: [] as Span[],
        transactions: [] as SentryTransactionEvent[],
        errors: 0,
        start_timestamp: event.start_timestamp ?? event.timestamp,
        timestamp: event.timestamp,
        status: traceCtx.status,
        rootTransactionName: event.transaction || '(unknown transaction)',
        rootTransaction: null,
        profileGrafted: false,
      };
      trace.timestamp = Math.max(event.timestamp, trace.timestamp);

      if (isTraceEvent(event)) {
        trace.transactions.push(event);
        trace.transactions.sort(compareSpans);

        // recompute tree as we might have txn out of order
        // XXX: we're trusting timestamps, which may not be as reliable as we'd like
        const spanMap: Map<string, Span> = new Map();
        for (const txn of trace.transactions) {
          const trace = txn.contexts.trace;
          if (!trace || !trace.span_id || !trace.trace_id) {
            continue;
          }

          spanMap.set(trace.span_id, {
            ...trace,
            // TypeScript is not smart enough to compose the assertion above
            // with the spread syntax above, hence the need for these explicit
            // `span_id` and `trace_id` assignments
            span_id: trace.span_id,
            trace_id: trace.trace_id,
            tags: txn?.tags,
            start_timestamp: txn.start_timestamp,
            timestamp: txn.timestamp,
            description: traceCtx.description || txn.transaction,
            transaction: txn,
          });

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
        graftProfileSpans(trace);
      } else if (isErrorEvent(event)) {
        trace.errors += 1;
      }
      if (traceCtx.status !== 'ok') trace.status = traceCtx.status;

      const roots = trace.transactions.filter(e => !e.contexts.trace.parent_span_id);
      if (roots.length === 1) {
        trace.rootTransaction = roots[0];
        trace.rootTransactionName = roots[0].transaction || '(unknown transaction)';
      } else if (roots.length > 1) trace.rootTransactionName = '(multiple root transactions)';
      else trace.rootTransactionName = '(missing root transaction)';

      if (!existingTrace) {
        this.traces.unshift(trace);
        this.tracesById.set(trace.trace_id, trace);
      }

      for (const [type, cb] of this.subscribers.values()) {
        if (type === 'trace') {
          cb(trace);
        }
      }
    }

    if (isProfileEvent(event)) {
      if (!event.transactions) {
        event.transactions = event.transaction ? [event.transaction] : [];
      }
      for (const txn of event.transactions) {
        // TODO: Defer if trace is missing!
        const trace = this.tracesById.get(txn.trace_id);
        const timestamp =
          trace && txn.relative_start_ns != null
            ? relativeNsToTimestamp(trace.start_timestamp, txn.relative_start_ns)
            : event.timestamp;
        this.profilesByTraceId.set(txn.trace_id, {
          platform: event.platform,
          thread_metadata: event.profile.thread_metadata,
          samples: event.profile.samples.map(s => ({
            stack_id: s.stack_id,
            thread_id: s.thread_id,
            elapsed_since_start_ns: s.elapsed_since_start_ns,
            start_timestamp: relativeNsToTimestamp(timestamp, s.elapsed_since_start_ns),
          })),
          frames: event.profile.frames,
          stacks: event.profile.stacks.map(s => Array.from(s).reverse()),
          timestamp,
          active_thread_id: txn.active_thread_id,
        });
        // Avoid grafting partial traces (where we mocked start_timestamp from the event's timestamp)
        // These should get grafted once we get the full trace data later on
        if (trace && trace.start_timestamp < trace.timestamp) {
          graftProfileSpans(trace);
        }
      }
    }

    for (const [type, cb] of this.subscribers.values()) {
      if (type === 'event') {
        cb(event);
      }
    }
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
    return this.tracesById.get(id);
  }

  getProfileByTraceId(id: string) {
    return this.profilesByTraceId.get(id);
  }

  getEventsByTrace(traceId: string, spanId?: string | null) {
    const filterFunc: (evt: SentryEvent) => boolean | undefined = !spanId
      ? evt => {
          const trace = evt.contexts?.trace;
          return trace && trace.trace_id === traceId && trace.span_id === spanId;
        }
      : evt => evt.contexts?.trace?.trace_id === traceId;
    return this.events.filter(filterFunc);
  }

  resetData() {
    this.envelopes = [];
    this.events = [];
    this.eventIds = new Set<string>();
    this.traces = [];
    this.tracesById = new Map();
    this.profilesByTraceId = new Map();
    this.localTraceIds = new Set<string>();
  }

  subscribe(...args: Subscription) {
    const id = generateUuidv4();
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
        if (!exception.stacktrace) {
          return;
        }
        exception.stacktrace.frames.reverse();

        if (
          exception.stacktrace.frames?.every(frame => frame.post_context && frame.pre_context && frame.context_line)
        ) {
          log('Skipping contextlines request as we have full context for', exception);
          return;
        }

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
      }),
    );
  }

  getFunctionProfiles(): FunctionProfile[] {
    // separate profiles
    const allProfiles: FunctionProfile[] = [];

    for (const [traceId, profile] of this.profilesByTraceId) {
      const functionProfiles = new Map<string, FunctionProfile>();

      // Go over each profile sample
      for (let sampleIdx = 0; sampleIdx < profile.samples.length - 1; sampleIdx++) {
        const sample = profile.samples[sampleIdx];
        const nextSample = profile.samples[sampleIdx + 1];
        const duration = nextSample.start_timestamp - sample.start_timestamp;

        const stackId = sample.stack_id;
        const frameIndices = profile.stacks[stackId];
        if (!frameIndices?.length) continue;

        // go over each stack frame (frame = 1 func/meth call)
        for (const frameIdx of frameIndices) {
          const frame = profile.frames[frameIdx];
          if (!frame) continue;

          const funcName =
            frame.function ||
            (frame.module
              ? `${frame.module}:<anonymous>`
              : frame.filename
                ? `${frame.filename}:${frame.lineno || '?'}`
                : '<unknown>');

          const existing = functionProfiles.get(funcName) || {
            name: funcName,
            totalTime: 0,
            samples: 0,
            frames: [],
            traceId, //
          };

          existing.totalTime += duration;
          existing.samples += 1;
          if (!existing.frames.includes(frame)) {
            existing.frames.push(frame);
          }

          functionProfiles.set(funcName, existing);
        }
      }

      allProfiles.push(...functionProfiles.values());
    }

    return allProfiles;
  }
}

export default new SentryDataCache();

export function isErrorEvent(event: SentryEvent): event is SentryErrorEvent {
  return (!event.type || ERROR_EVENT_TYPES.has(event.type)) && Boolean((event as SentryErrorEvent).exception);
}

export function isProfileEvent(event: SentryEvent): event is SentryProfileV1Event {
  return !!event.type && PROFILE_EVENT_TYPES.has(event.type) && (event as SentryProfileV1Event).version === '1';
}

export function isTraceEvent(event: SentryEvent): event is SentryTransactionEvent {
  return !!event.type && TRACE_EVENT_TYPES.has(event.type);
}
