import type { Envelope } from "@sentry/core";
import type {
  AggregateCallData,
  Sdk,
  SentryErrorEvent,
  SentryEvent,
  SentryLogEventItem,
  SentryMetricPayload,
  SentryProcessedProfile,
  Trace,
} from "../types";
import type { ProcessedProfileChunk } from "./utils/profileChunkProcessor";

export type SentryProfileWithTraceMeta = SentryProcessedProfile & {
  timestamp: number;
  active_thread_id: string;
};

export type OnlineSubscription = ["online", (status: boolean) => void];
export type EventSubscription = ["event", (event: SentryEvent) => void];
export type TraceSubscription = ["trace", (trace: Trace) => void];
export type Subscription = OnlineSubscription | EventSubscription | TraceSubscription;

export interface EventsSliceState {
  eventsById: Map<string, SentryEvent>;
}

export interface EventsSliceActions {
  pushEvent: (event: SentryEvent & { event_id?: string }) => Promise<void>;
  getEvents: () => SentryEvent[];
}

export interface TracesSliceState {
  tracesById: Map<string, Trace>;
}

export interface TracesSliceActions {
  getTraces: () => Trace[];
}

export interface ProfilesSliceState {
  /** Final merged profiles keyed by trace_id - works for both V1 and V2 */
  profilesByTraceId: Map<string, SentryProfileWithTraceMeta>;
  /** Internal: V2 chunks being accumulated, keyed by profiler_id */
  profileChunksByProfilerId: Map<string, ProcessedProfileChunk[]>;
}

export interface ProfilesSliceActions {
  /** Get profile for a trace - unified access for both V1 and V2 profiles */
  getProfileByTraceId: (id: string) => SentryProfileWithTraceMeta | undefined;
  getAggregateCallData: () => AggregateCallData[];
}

export interface SubscriptionsSliceState {
  subscribers: Map<string, Subscription>;
}

export interface SubscriptionsSliceActions {
  subscribe: (...args: Subscription) => () => void;
}

export interface SettingsSliceState {
  contextLinesProvider: string;
}

export interface SettingsSliceActions {
  setSidecarUrl: (url: string) => void;
}

export interface EnvelopesSliceState {
  envelopes: Map<string, Envelope>;
}

export interface EnvelopesSliceActions {
  pushEnvelope: (params: Envelope) => number;
  getEnvelopeById: (id: string) => Envelope | undefined;
  getEnvelopes: () => Array<Envelope>;
}

export interface SDKsSliceState {
  sdks: Map<string, Sdk>;
}

export interface LogsSliceState {
  logsById: Map<string, SentryLogEventItem>;
  logsByTraceId: Map<string, Set<SentryLogEventItem>>;
}

export interface LogsSliceActions {
  getLogById: (id: string) => SentryLogEventItem | undefined;
  getLogs: () => SentryLogEventItem[];
  getLogsByTraceId: (traceId: string) => SentryLogEventItem[];
}

export interface MetricsSliceState {
  metricsById: Map<string, SentryMetricPayload>;
  metricsByTraceId: Map<string, Set<SentryMetricPayload>>;
  metricsByName: Map<string, SentryMetricPayload[]>;
}

export interface MetricsSliceActions {
  getMetricById: (id: string) => SentryMetricPayload | undefined;
  getMetrics: () => SentryMetricPayload[];
  getMetricsByTraceId: (traceId: string) => SentryMetricPayload[];
  getMetricsByName: (name: string) => SentryMetricPayload[];
  getMetricNames: () => string[];
}

export interface SDKsSliceActions {
  inferSdkFromEvent: (event: SentryEvent) => Sdk;
  storeSdkRecord: (sdk: Sdk) => Sdk;
  getSdks: () => Sdk[];
}

export interface SharedSliceActions {
  getEventById: (id: string) => SentryEvent | undefined;
  getTraceById: (id: string) => Trace | undefined;
  getEventsByTrace: (traceId: string, spanId?: string | null) => SentryEvent[];
  processStacktrace: (errorEvent: SentryErrorEvent) => Promise<void>;
  resetData: () => void;
}

export type SentryStoreState = EventsSliceState &
  TracesSliceState &
  ProfilesSliceState &
  SubscriptionsSliceState &
  SettingsSliceState &
  EnvelopesSliceState &
  LogsSliceState &
  MetricsSliceState &
  SDKsSliceState;

export type SentryStoreActions = EventsSliceActions &
  TracesSliceActions &
  ProfilesSliceActions &
  SubscriptionsSliceActions &
  SettingsSliceActions &
  EnvelopesSliceActions &
  LogsSliceActions &
  MetricsSliceActions &
  SDKsSliceActions &
  SharedSliceActions;

export type SentryStore = SentryStoreState & SentryStoreActions;
