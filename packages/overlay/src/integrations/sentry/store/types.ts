import type { Envelope } from "@sentry/core";
import type { RawEventContext } from "~/integrations/integration";
import type {
  AggregateCallData,
  Sdk,
  SentryErrorEvent,
  SentryEvent,
  SentryLogEventItem,
  SentryProcessedProfile,
  Span,
  Trace,
} from "../types";

export type SentryProfileWithTraceMeta = SentryProcessedProfile & {
  timestamp: number;
  active_thread_id: string;
};

export type OnlineSubscription = ["online", (status: boolean) => void];
export type EventSubscription = ["event", (event: SentryEvent) => void];
export type TraceSubscription = ["trace", (trace: Trace) => void];
export type Subscription = OnlineSubscription | EventSubscription | TraceSubscription;

export interface EventsSliceState {
  events: SentryEvent[];
  eventsById: Map<string, SentryEvent>;
}

export interface EventsSliceActions {
  pushEvent: (event: SentryEvent & { event_id?: string }) => Promise<void>;
  getEvents: () => SentryEvent[];
}

export interface TracesSliceState {
  traces: Trace[];
  tracesById: Map<string, Trace>;
  localTraceIds: Set<string>;
}

export interface TracesSliceActions {
  trackLocalTrace: (traceId: string) => void;
  getTraces: () => Trace[];
}

export interface ProfilesSliceState {
  profilesByTraceId: Map<string, SentryProfileWithTraceMeta>;
}

export interface ProfilesSliceActions {
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
  envelopes: Array<{ envelope: Envelope; rawEnvelope: RawEventContext }>;
}

export interface EnvelopesSliceActions {
  pushEnvelope: (params: { envelope: Envelope; rawEnvelope: RawEventContext }) => number;
  getEnvelopes: () => Array<{ envelope: Envelope; rawEnvelope: RawEventContext }>;
}

export interface SDKsSliceState {
  sdks: Sdk[];
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

export interface SDKsSliceActions {
  inferSdkFromEvent: (event: SentryEvent) => Sdk;
  getSdks: () => Sdk[];
}

export interface SharedSliceActions {
  getEventById: (id: string) => SentryEvent | undefined;
  getTraceById: (id: string) => Trace | undefined;
  getSpanById: (id: string) => Span | undefined;
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
  SDKsSliceState;

export type SentryStoreActions = EventsSliceActions &
  TracesSliceActions &
  ProfilesSliceActions &
  SubscriptionsSliceActions &
  SettingsSliceActions &
  EnvelopesSliceActions &
  LogsSliceActions &
  SDKsSliceActions &
  SharedSliceActions;

export type SentryStore = SentryStoreState & SentryStoreActions;
