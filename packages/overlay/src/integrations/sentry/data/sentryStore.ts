import type { Envelope } from '@sentry/core';
import { CONTEXT_LINES_ENDPOINT } from '@spotlightjs/sidecar/constants';
import { create } from 'zustand';
import { DEFAULT_SIDECAR_URL } from '../../../constants';
import { log } from '../../../lib/logger';
import { generateUuidv4 } from '../../../lib/uuid';
import type { RawEventContext } from '../../integration';
import { SUPPORTED_EVENT_TYPES } from '../constants/sentry';
import {
  EventFrame,
  TraceId,
  type AggregateCallData,
  type ProfileSample,
  type Sdk,
  type SentryErrorEvent,
  type SentryEvent,
  type SentryProcessedProfile,
  type SentryProfileTransactionInfo,
  type SentryTransactionEvent,
  type Span,
  type Trace,
} from '../types';
import { getNativeFetchImplementation } from '../utils/fetch';
import { sdkToPlatform } from '../utils/sdkToPlatform';
import { isErrorEvent, isProfileEvent, isTraceEvent } from '../utils/sentry';
import { compareSpans, groupSpans } from '../utils/traces';
import { getFunctionNameFromFrame, graftProfileSpans } from './profiles';

function toTimestamp(date: string | number) {
  if (typeof date === 'string') return new Date(date).getTime();
  return date * 1000;
}

function relativeNsToTimestamp(startTs: number, ns: number | string) {
  const nsStr = ns.toString();
  return nsStr.length > 3 ? startTs + Number.parseInt(nsStr.slice(0, -3), 10) / 1000 : startTs;
}

export type SentryProfileWithTraceMeta = SentryProcessedProfile & {
  timestamp: number;
  active_thread_id: string;
};

type OnlineSubscription = ['online', (status: boolean) => void];
type EventSubscription = ['event', (event: SentryEvent) => void];
type TraceSubscription = ['trace', (trace: Trace) => void];
type Subscription = OnlineSubscription | EventSubscription | TraceSubscription;

interface SentryStoreState {
  events: SentryEvent[];
  eventIds: Set<string>;
  sdks: Sdk[];
  traces: Trace[];
  tracesById: Map<string, Trace>;
  profilesByTraceId: Map<string, SentryProfileWithTraceMeta>;
  localTraceIds: Set<string>;
  envelopes: Array<{
    envelope: Envelope;
    rawEnvelope: RawEventContext;
  }>;

  contextLinesProvider: string;
  subscribers: Map<string, Subscription>;
}

interface SentryStoreActions {
  pushEnvelope: (params: { envelope: Envelope; rawEnvelope: RawEventContext }) => number;
  pushEvent: (event: SentryEvent & { event_id?: string }) => Promise<void>;
  resetData: () => void;

  trackLocalTrace: (traceId: string) => void;
  isTraceLocal: (traceId: string) => boolean | null;

  getEvents: () => SentryEvent[];
  getTraces: () => Trace[];
  getSdks: () => Sdk[];
  getEnvelopes: () => Array<{ envelope: Envelope; rawEnvelope: RawEventContext }>;
  getEventById: (id: string) => SentryEvent | undefined;
  getTraceById: (id: string) => Trace | undefined;
  getProfileByTraceId: (id: string) => SentryProfileWithTraceMeta | undefined;
  getEventsByTrace: (traceId: string, spanId?: string | null) => SentryEvent[];
  getAggregateCallData: () => AggregateCallData[];

  setSidecarUrl: (url: string) => void;

  inferSdkFromEvent: (event: SentryEvent) => Sdk;
  processStacktrace: (errorEvent: SentryErrorEvent) => Promise<void[]>;

  subscribe: (...args: Subscription) => () => void;
}

const useSentryStore = create<SentryStoreState & SentryStoreActions>()((set, get) => ({
  events: [],
  eventIds: new Set(),
  sdks: [],
  traces: [],
  tracesById: new Map(),
  profilesByTraceId: new Map(),
  localTraceIds: new Set(),
  envelopes: [],
  contextLinesProvider: new URL(CONTEXT_LINES_ENDPOINT, DEFAULT_SIDECAR_URL).href,
  subscribers: new Map(),

  setSidecarUrl: (url: string) => {
    const { href: contextLinesProviderUrl } = new URL(CONTEXT_LINES_ENDPOINT, url);
    set({ contextLinesProvider: contextLinesProviderUrl });
  },

  pushEnvelope: ({ envelope, rawEnvelope }) => {
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
      sdk = get().inferSdkFromEvent(items[0][1] as SentryEvent);
    } else {
      sdk = {
        name: 'unknown',
        version: '0.0.0',
        lastSeen,
      };
    }

    const { sdks } = get();
    const existingSdk = sdks.find(s => s.name === sdk.name && s.version === sdk.version);
    if (existingSdk) {
      existingSdk.lastSeen = lastSeen;
    } else {
      set({ sdks: [...sdks, sdk] });
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
        get().pushEvent(itemData as SentryEvent);
      }
    }

    const { envelopes } = get();
    const newEnvelopes = [...envelopes, { envelope, rawEnvelope }];
    set({ envelopes: newEnvelopes });
    return newEnvelopes.length;
  },

  pushEvent: async event => {
    if (!event.event_id) {
      event.event_id = generateUuidv4();
    }

    const { eventIds, events } = get();
    if (eventIds.has(event.event_id)) return;

    const newEventIds = new Set(eventIds);
    newEventIds.add(event.event_id);
    set({ eventIds: newEventIds });

    if (isErrorEvent(event)) {
      await get().processStacktrace(event);
    }

    event.timestamp = toTimestamp(event.timestamp);
    if (event.start_timestamp) {
      event.start_timestamp = toTimestamp(event.start_timestamp);
    }

    const traceCtx = event.contexts?.trace;
    const newEvents = [...events, event];
    set({ events: newEvents });

    // Notify event subscribers
    for (const [type, callback] of get().subscribers.values()) {
      if (type === 'event') {
        (callback as (event: SentryEvent) => void)(event);
      }
    }

    if (traceCtx?.trace_id) {
      const { tracesById, traces } = get();
      const existingTrace = tracesById.get(traceCtx.trace_id);
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
        const newTracesById = new Map(tracesById);
        newTracesById.set(trace.trace_id, trace);
        traces.unshift(trace);
        set({
          traces,
          tracesById: newTracesById,
        });
      }
    }

    if (isProfileEvent(event)) {
      if (!event.transactions) {
        event.transactions = event.transaction ? [event.transaction] : [];
      }
      const { profilesByTraceId, tracesById } = get();
      const newProfilesByTraceId = new Map(profilesByTraceId);

      for (const txn of event.transactions) {
        if (typeof txn === 'string') continue; // Skip if it's just a string transaction ID
        const profileTxn = txn as SentryProfileTransactionInfo;
        const trace = tracesById.get(profileTxn.trace_id);
        const timestamp =
          trace && profileTxn.relative_start_ns != null
            ? relativeNsToTimestamp(trace.start_timestamp, profileTxn.relative_start_ns)
            : event.timestamp;

        const profile = {
          platform: event.platform,
          thread_metadata: event.profile.thread_metadata,
          samples: event.profile.samples.map((s: ProfileSample) => ({
            stack_id: s.stack_id,
            thread_id: s.thread_id,
            elapsed_since_start_ns: s.elapsed_since_start_ns,
            start_timestamp: relativeNsToTimestamp(timestamp, s.elapsed_since_start_ns),
          })),
          frames: event.profile.frames,
          stacks: event.profile.stacks.map(s => Array.from(s).reverse()),
          timestamp,
          active_thread_id: profileTxn.active_thread_id,
        };
        newProfilesByTraceId.set(profileTxn.trace_id, profile);
        // Avoid grafting partial traces (where we mocked start_timestamp from the event's timestamp)
        // These should get grafted once we get the full trace data later on
        if (trace && trace.start_timestamp < trace.timestamp) {
          graftProfileSpans(trace, profile);
        }
      }
      set({ profilesByTraceId: newProfilesByTraceId });
    }
  },

  resetData: () => {
    set({
      envelopes: [],
      events: [],
      eventIds: new Set(),
      traces: [],
      tracesById: new Map(),
      profilesByTraceId: new Map(),
      localTraceIds: new Set(),
    });
  },

  trackLocalTrace: (traceId: string) => {
    const { localTraceIds } = get();
    if (!localTraceIds.has(traceId)) {
      const newLocalTraceIds = new Set(localTraceIds);
      newLocalTraceIds.add(traceId);
      set({ localTraceIds: newLocalTraceIds });
    }
  },

  isTraceLocal: (traceId: string) => {
    const { localTraceIds } = get();
    if (localTraceIds.has(traceId)) return true;
    if (localTraceIds.size > 0) return false;
    return null;
  },

  getEvents: () => get().events,
  getTraces: () => get().traces,
  getSdks: () => get().sdks,
  getEnvelopes: () => get().envelopes,
  getEventById: (id: string) => get().events.find(e => e.event_id === id),
  getTraceById: (id: string) => get().tracesById.get(id),
  getProfileByTraceId: (id: string) => get().profilesByTraceId.get(id),
  getEventsByTrace: (traceId: string, spanId?: string | null) => {
    const { events } = get();
    return events.filter(evt => {
      const trace = evt.contexts?.trace;
      if (!trace || trace.trace_id !== traceId) return false;
      if (spanId !== undefined) return trace.span_id === spanId;
      return true;
    });
  },

  inferSdkFromEvent: (event: SentryEvent) => {
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
  },

  processStacktrace: async (errorEvent: SentryErrorEvent): Promise<void[]> => {
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
          const stackTraceWithContextResponse = await makeFetch(get().contextLinesProvider, {
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
  },

  getAggregateCallData(): AggregateCallData[] {
    const aggregateCalls = new Map<string, AggregateCallData>();
    for (const [traceId, profile] of this.profilesByTraceId) {
      for (let sampleIdx = 0; sampleIdx < profile.samples.length - 1; sampleIdx++) {
        const sample = profile.samples[sampleIdx];
        const nextSample = profile.samples[sampleIdx + 1];
        // TODO: Handle the case where nextSample is undefined -- use the end of the profile or associated trace
        const duration = nextSample.start_timestamp - sample.start_timestamp;
        // TODO: Keep a running average based on continuous samples -- as in where we keep seeing the same
        //       function name / frame back to back

        const stackId = sample.stack_id;
        const frameIndices = profile.stacks[stackId];

        for (const frameIdx of frameIndices) {
          const frame = profile.frames[frameIdx];
          const name = getFunctionNameFromFrame(frame);
          const callData = aggregateCalls.get(name);
          if (callData) {
            callData.totalTime += duration;
            callData.samples += 1;
            callData.frames.add(frame);
            callData.traceIds.add(traceId);
          } else {
            aggregateCalls.set(name, {
              name,
              totalTime: duration,
              samples: 1,
              frames: new Set<EventFrame>([frame]),
              traceIds: new Set<TraceId>([traceId]),
            });
          }
        }
      }
    }

    return Array.from(aggregateCalls.values());
  },

  subscribe: (...args: Subscription) => {
    const id = generateUuidv4();
    const { subscribers } = get();
    const newSubscribers = new Map(subscribers);
    newSubscribers.set(id, args);
    set({ subscribers: newSubscribers });

    return () => {
      const { subscribers: currentSubscribers } = get();
      const updatedSubscribers = new Map(currentSubscribers);
      updatedSubscribers.delete(id);
      set({ subscribers: updatedSubscribers });
    };
  },
}));

export default useSentryStore;
