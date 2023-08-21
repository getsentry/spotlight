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

type CommonEventAttrs = {
  event_id: string;
};

export type SentryErrorEvent = CommonEventAttrs & {
  exception: EventException;
};

export type SentryTransactionEvent = CommonEventAttrs & {
  type: "transactiokn";
};

export type SentryEvent = SentryErrorEvent | SentryTransactionEvent;
