import type { Envelope } from "@sentry/core";
import type {
  ProfileFunctionSummary as InternalProfileFunctionSummary,
  QuerySummary as InternalQuerySummary,
  ResourceSummary as InternalResourceSummary,
} from "./selectors/index.ts";

import type {
  AITrace as InternalAITrace,
  Sdk,
  SentryErrorEvent,
  SentryEvent,
  SentryEventWithPerformanceData,
  SentryLogEventItem,
  SentryProfileWithTraceMeta,
  Span,
  Trace,
} from "./types.ts";

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends ReadonlyMap<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends ReadonlySet<infer V>
      ? ReadonlySet<DeepReadonly<V>>
      : T extends readonly unknown[]
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
          : T;

/** A parsed Sentry wire envelope; input timestamps retain their wire units. */
export type RawEnvelope = Envelope;
export type ProcessedEvent = DeepReadonly<SentryEvent>;
export type ProcessedSpan = DeepReadonly<Span>;
export type ProcessedTrace = DeepReadonly<Trace>;
export type ProcessedLog = DeepReadonly<SentryLogEventItem>;
export type ProcessedProfile = DeepReadonly<SentryProfileWithTraceMeta>;
export type AITrace = DeepReadonly<InternalAITrace>;
export type QuerySummary = DeepReadonly<InternalQuerySummary>;
export type ResourceSummary = DeepReadonly<InternalResourceSummary>;
export type ProfileFunctionSummary = DeepReadonly<InternalProfileFunctionSummary>;
export type Diagnostic = { readonly code: string; readonly message: string };
export type IngestResult =
  | { readonly status: "processed"; readonly envelopeId: string; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly status: "ignored";
      readonly reason: string;
      readonly envelopeId?: string;
      readonly diagnostics: readonly Diagnostic[];
    }
  | { readonly status: "invalid"; readonly diagnostics: readonly Diagnostic[] };
export type TraceFilter = { traceId?: string };
export type EventFilter = TraceFilter & { spanId?: string };
export type DatabaseQueryFilter = TraceFilter & { description?: string };
export type RetentionOptions = {
  /** Maximum retained envelopes, including all telemetry derived from them. Default: 500. */
  maxEnvelopes?: number;
  /** Optional maximum age since receipt. Expiration runs automatically; dispose releases the timer. */
  maxAgeMs?: number;
};
export type TelemetryOptions = {
  retention?: RetentionOptions;
  enrichStacktrace?: (event: SentryErrorEvent) => Promise<void>;
  onDiagnostic?: (diagnostic: Diagnostic) => void;
};
export type TelemetrySnapshot = {
  readonly revision: number;
  readonly envelopes: readonly DeepReadonly<RawEnvelope>[];
  readonly events: readonly ProcessedEvent[];
  readonly traces: readonly ProcessedTrace[];
  readonly logs: readonly ProcessedLog[];
  readonly sdks: readonly DeepReadonly<Sdk>[];
  readonly profiles: ReadonlyMap<string, ProcessedProfile>;
};
export type Telemetry = {
  ingestEnvelope: (input: unknown) => Promise<IngestResult>;
  getSnapshot: () => TelemetrySnapshot;
  getEnvelope: (id: string) => DeepReadonly<RawEnvelope> | undefined;
  getEnvelopes: () => readonly DeepReadonly<RawEnvelope>[];
  getEvent: (id: string) => ProcessedEvent | undefined;
  getEvents: (filter?: EventFilter) => readonly ProcessedEvent[];
  getErrors: (filter?: EventFilter) => readonly DeepReadonly<SentryErrorEvent>[];
  getTrace: (id: string) => ProcessedTrace | undefined;
  getTraces: (filter?: TraceFilter) => readonly ProcessedTrace[];
  getSpans: (filter?: TraceFilter) => readonly ProcessedSpan[];
  getLog: (id: string) => ProcessedLog | undefined;
  getLogs: (filter?: TraceFilter) => readonly ProcessedLog[];
  getProfile: (traceId: string) => ProcessedProfile | undefined;
  getProfileFunctionSummaries: (filter?: TraceFilter) => readonly ProfileFunctionSummary[];
  getQuerySummaries: (filter?: DatabaseQueryFilter) => readonly QuerySummary[];
  getResourceSummaries: (filter?: TraceFilter) => readonly ResourceSummary[];
  getAITraces: (filter?: TraceFilter) => readonly AITrace[];
  getWebVitals: () => readonly DeepReadonly<SentryEventWithPerformanceData>[];
  getSdks: () => readonly DeepReadonly<Sdk>[];
  subscribe: (listener: (snapshot: TelemetrySnapshot) => void) => () => void;
  reset: () => void;
  prune: () => Promise<void>;
  dispose: () => void;
};
