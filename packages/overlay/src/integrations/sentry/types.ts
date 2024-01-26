import { Measurements } from '@sentry/types';

export type FrameVars = {
  [key: string]: string;
};

export type EventFrame = {
  filename: string;
  abs_path?: string;
  function?: string;
  module?: string;
  lineno?: number;
  colno?: number;
  pre_context?: string[];
  post_context?: string[];
  context_line?: string;
  vars?: FrameVars;
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
  message: string;
  category: string;
  timestamp: string;
  type: string | 'default';
};

type CommonEventAttrs = {
  // not always present, but we are forcing it in EventCache
  event_id: string;
  timestamp: number;
  message?: string;
  breadcrumbs?: Breadcrumb[] | { values: Breadcrumb[] };
  transaction?: string;
  environment?: string;
  platform?: string;
  server_name?: string;
  release?: string;
  start_timestamp?: number;
  contexts?: Contexts;
  tags?: Tags;
  extra?: { [key: string]: string | number };
  sdk?: Sdk;
  measurements?: Measurements;
};

export type Context = {
  [key: string]: string | number;
};

export type TraceContext = {
  trace_id: string;
  span_id: string;
  parent_span_id?: string | null;
  op: string;
  description?: string | null;
  status: 'ok' | string;
};

export type Contexts = {
  trace?: TraceContext;
} & {
  [key: string]: Context;
};

export type Tags = {
  [key: string]: string;
};

export type SentryErrorEvent = CommonEventAttrs & {
  type?: 'error' | 'event' | 'default';
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
  spans: Span[];
  start_timestamp: string;
  contexts: Contexts & {
    trace: TraceContext;
  };
};

export type SentryEvent = SentryErrorEvent | SentryTransactionEvent;

export type Trace = TraceContext & {
  transactions: SentryTransactionEvent[];
  errors: number;
  start_timestamp: number;
  timestamp: number;
  status: string;
  rootTransaction: SentryTransactionEvent | null;
  rootTransactionName: string;
  spans: Span[];
  spanTree: Span[];
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
