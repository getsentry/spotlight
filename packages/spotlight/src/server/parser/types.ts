import type { EventEnvelopeHeaders, Measurements, SerializedLog } from "@sentry/core";

export type RawEventContext = {
  /**
   * The content-type header of the event
   */
  contentType: string;

  /**
   * The raw data in string form of the request.
   * Use this function to parse and process the raw data it to whatever data structure
   * you expect for the given `contentType`.
   *
   * Return the processed object or undefined if the event should be ignored.
   */
  data: string | Uint8Array;
};

export type TraceId = string;
export type SpanId = string;

export type FrameVars = {
  [key: string]: string;
};

export type EventFrame = {
  filename?: string;
  abs_path?: string;
  function?: string;
  module?: string;
  lineno?: number;
  colno?: number;
  pre_context?: string[];
  post_context?: string[];
  context_line?: string;
  vars?: FrameVars;
  instruction_addr?: string;
  in_app?: boolean;
};

export type EventStacktrace = {
  frames: EventFrame[];
};

export type EventExceptionValue = {
  type: string;
  value: string;
  stacktrace?: EventStacktrace;
};

export type EventException =
  | {
      values: EventExceptionValue[];
      value: undefined;
    }
  | {
      values: undefined;
      value: EventExceptionValue;
    };

export type Breadcrumb = {
  data?: Record<string, unknown>;
  message?: string;
  category: string;
  timestamp: string;
  type: string | "default";
};

export type Context = Record<string, string | number>;

export type Sdk = {
  name: string;
  version: string;
  lastSeen: number;
};

type CommonEventAttrs = {
  // not always present, but we are forcing it in EventCache
  event_id: string;
  timestamp: number;
  message?: SentryFormattedMessage;
  breadcrumbs?: Breadcrumb[] | { values: Breadcrumb[] };
  transaction?: string;
  environment?: string;
  platform?: string;
  server_name?: string;
  release?: string;
  start_timestamp?: number;
  contexts?: Contexts;
  tags?: Tags;
  extra?: Context;
  request?: Record<string, Record<string, string> | string>;
  modules?: Record<string, string>;
  sdk?: Sdk;
  measurements?: Measurements;
};

// Note: For some reason the `sentry/core` module doesn't have these additional properties
// in `EventEnvelopeHeaders['trace']` but they are present in the actual events.
// Follow up?
export type TraceContext = EventEnvelopeHeaders["trace"] & {
  span_id?: string;
  status?: "ok" | string;
  description?: string;
  parent_span_id?: string;
  data?: Record<string, string>;
  op?: string;
};

export type Contexts = {
  trace?: TraceContext;
} & {
  [key: string]: Context;
};

export type Tags = {
  [key: string]: string;
};

export type SentryFormattedMessage =
  | string
  | {
      formatted: string;
      params?: [];
    };

export type SentryErrorEvent = CommonEventAttrs & {
  type?: "error" | "event" | "message" | "default";
  exception?: EventException;
};

export type Span = {
  trace_id?: TraceId;
  span_id: SpanId;
  parent_span_id?: string | null;
  op?: string | null;
  description?: string | null;
  start_timestamp: number;
  tags?: Tags | null;
  timestamp: number;
  status?: "ok" | string;
  transaction?: SentryTransactionEvent;
  children?: Span[];
  data?: Record<string, unknown>;
};

export type SentryTransactionEvent = CommonEventAttrs & {
  type: "transaction";
  spans?: Span[];
  start_timestamp: string;
  contexts: Contexts & {
    trace: TraceContext;
  };
};

export type ProfileSample = {
  elapsed_since_start_ns: string;
  stack_id: number;
  thread_id: string;
};

export type ProcessedProfileSample = {
  start_timestamp: number;
  stack_id: number;
  thread_id: string;
};

export type SentryProfile = {
  samples: ProfileSample[];
  stacks: number[][];
  frames: EventFrame[];
  platform?: string;
  thread_metadata?: Record<
    string,
    {
      name?: string;
      priority?: number;
    }
  >;
};

export type SentryProcessedProfile = SentryProfile & {
  samples: ProcessedProfileSample[];
};

export type AggregateCallData = {
  name: string;
  totalTime: number;
  samples: number;
  traceIds: Set<TraceId>;
};

export type SentryDeviceInfo = {
  architecture: string;
  is_emulator?: boolean;
  locale?: string;
  manufacturer?: string;
  model?: string;
};

export type SentryOSInfo = {
  name: string;
  version: string;
  build_number?: string;
};

export type SentryProfileTransactionInfo = {
  name: string;
  id: string;
  trace_id: string;
  active_thread_id: string;
  relative_start_ns?: string;
  relative_end_ns?: string;
};

export type SentryProfileV1Event = CommonEventAttrs & {
  type: "profile";
  device: SentryDeviceInfo;
  os: SentryOSInfo;
  transactions?: Array<SentryProfileTransactionInfo>;
  transaction?: SentryProfileTransactionInfo;
  version: "1";
  profile: SentryProfile;
};

// V2 Profile (Continuous Profiling) Types
export type ProfileV2Sample = {
  timestamp: number; // Unix timestamp in seconds with microseconds precision
  stack_id: number;
  thread_id: string;
};

export type ProfileV2MeasurementValue = {
  timestamp: number;
  value: number;
};

export type ProfileV2Measurement = {
  unit: string;
  values: ProfileV2MeasurementValue[];
};

export type SentryProfileV2 = {
  samples: ProfileV2Sample[];
  stacks: number[][];
  frames: EventFrame[];
  thread_metadata: Record<
    string,
    {
      name?: string;
      priority?: number;
    }
  >;
};

export type SentryProfileV2ChunkEvent = {
  type: "profile_chunk";
  version: "2";
  profiler_id: string; // Links chunks from same profiler session
  chunk_id: string; // Unique ID for this chunk
  platform: string;
  release?: string;
  environment?: string;
  client_sdk?: {
    name: string;
    version: string;
  };
  debug_meta?: {
    images?: Array<{
      debug_id?: string;
      image_addr?: string;
      type?: string;
      image_size?: number;
      code_file?: string;
    }>;
  };
  measurements?: Record<string, ProfileV2Measurement>;
  profile: SentryProfileV2;
};

export type SentryLogEventItem = SerializedLog & {
  id: string; // Need to have a unique id for each log
  severity_number: number;
  sdk: string | undefined;
};

export type SentryLogEvent = CommonEventAttrs & {
  type: "log";
  items: Array<SentryLogEventItem>;
};

export type SentryEvent =
  | SentryErrorEvent
  | SentryTransactionEvent
  | SentryProfileV1Event
  | SentryProfileV2ChunkEvent
  | SentryLogEvent;
