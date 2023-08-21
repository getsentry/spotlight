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
  vars?: {
    [key: string]: string;
  };
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
    }
  | {
      value: EventExceptionValue;
    };

export type Breadcrumbs = {
  values: {
    message: string;
    category: string;
    timestamp: string;
    type: string | "default";
  }[];
};

export type Context = {
  [key: string]: string | number;
};

type CommonEventAttrs = {
  event_id: string;
  timestamp: string;
  breadcrumbs?: Breadcrumbs;
  transaction?: string;
  contexts?: {
    [key: string]: Context;
  };
};

export type SentryErrorEvent = CommonEventAttrs & {
  exception: EventException;
};

export type SentryTransactionEvent = CommonEventAttrs & {
  type: "transaction";
};

export type SentryEvent = SentryErrorEvent | SentryTransactionEvent;
