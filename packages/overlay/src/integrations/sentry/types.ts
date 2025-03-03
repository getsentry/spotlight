import type { Measurements } from '@sentry/core';

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
  type: string | 'default';
};

export type Context = Record<string, string | number>;

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

export type TraceContext = {
  trace_id: string;
  span_id: string;
  parent_span_id?: string | null;
  op: string;
  description?: string | null;
  status: 'ok' | string;
  data?: Context;
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
  type?: 'error' | 'event' | 'message' | 'default';
  exception: EventException;
};

export type Span = {
  trace_id: string;
  span_id: string;
  parent_span_id?: string | null;
  op?: string | null;
  description?: string | null;
  start_timestamp: number;
  tags?: Tags | null;
  timestamp: number;
  status: 'ok' | string;
  transaction?: SentryTransactionEvent;
  children?: Span[];
  data?: Record<string, unknown>;
};

export type SentryTransactionEvent = CommonEventAttrs & {
  type: 'transaction';
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
  type: 'profile';
  device: SentryDeviceInfo;
  os: SentryOSInfo;
  transactions?: Array<SentryProfileTransactionInfo>;
  transaction?: SentryProfileTransactionInfo;
  version: '1';
  profile: SentryProfile;
};

export type SentryEvent = SentryErrorEvent | SentryTransactionEvent | SentryProfileV1Event;

export type Trace = TraceContext & {
  transactions: SentryTransactionEvent[];
  errors: number;
  start_timestamp: number;
  timestamp: number;
  status: string;
  rootTransaction: SentryTransactionEvent | null;
  rootTransactionName: string;
  spans: Map<string, Span>;
  spanTree: Span[];
  profileGrafted: boolean;
};

export type Sdk = {
  name: string;
  version: string;
  lastSeen: number;
};

export type SentryEventWithPerformanceData = Omit<SentryEvent, 'measurements'> & {
  measurements: Record<
    string,
    {
      value: number;
      unit: string;
    }
  > & {
    'score.total': {
      value: number;
      unit: string;
    };
    'score.fcp': {
      value: number;
      unit: string;
    };
    'score.lcp': {
      value: number;
      unit: string;
    };
    'score.fid': {
      value: number;
      unit: string;
    };
    'score.cls': {
      value: number;
      unit: string;
    };
    'score.ttfb': {
      value: number;
      unit: string;
    };
    'score.weight.fcp': {
      value: number;
      unit: string;
    };
    'score.weight.lcp': {
      value: number;
      unit: string;
    };
    'score.weight.fid': {
      value: number;
      unit: string;
    };
    'score.weight.cls': {
      value: number;
      unit: string;
    };
    'score.weight.ttfb': {
      value: number;
      unit: string;
    };
  };
};

export type MetricScoreProps = {
  fcpScore: number;
  lcpScore: number;
  clsScore: number;
  fidScore: number;
  ttfbScore: number;
};
export type MetricWeightsProps = {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
};
