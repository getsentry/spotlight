import type { Envelope } from "@sentry/core";
import type {
  AggregateCallData,
  Sdk,
  SentryErrorEvent,
  SentryEvent,
  SentryLogEventItem,
  SentryProcessedProfile,
  Trace,
} from "../types";
import type { InstanceInfo } from "./slices/instancesSlice";

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

export interface SDKsSliceActions {
  inferSdkFromEvent: (event: SentryEvent) => Sdk;
  storeSdkRecord: (sdk: Sdk) => Sdk;
  getSdks: () => Sdk[];
}

export interface InstancesSliceState {
  instances: InstanceInfo[];
  currentInstanceId: string | null;
  isLoadingInstances: boolean;
}

export interface InstancesSliceActions {
  setInstances: (instances: InstanceInfo[]) => void;
  addOrUpdateInstance: (instance: InstanceInfo) => void;
  removeInstance: (instanceId: string) => void;
  setCurrentInstance: (instanceId: string | null) => void;
  setLoadingInstances: (isLoading: boolean) => void;
  fetchInstances: () => Promise<void>;
  terminateInstance: (instanceId: string) => Promise<boolean>;
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
  SDKsSliceState &
  InstancesSliceState;

export type SentryStoreActions = EventsSliceActions &
  TracesSliceActions &
  ProfilesSliceActions &
  SubscriptionsSliceActions &
  SettingsSliceActions &
  EnvelopesSliceActions &
  LogsSliceActions &
  SDKsSliceActions &
  InstancesSliceActions &
  SharedSliceActions;

export type SentryStore = SentryStoreState & SentryStoreActions;
