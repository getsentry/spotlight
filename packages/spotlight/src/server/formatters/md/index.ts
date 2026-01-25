import { isErrorEvent, isLogEvent, isMetricEvent, isTraceEvent } from "../../parser/helpers.ts";
import type { FormatterRegistry } from "../types.ts";
import { formatError } from "./errors.ts";
import { formatLog } from "./logs.ts";
import { formatMetric } from "./metrics.ts";
import { formatTrace } from "./traces.ts";

export const formatters: FormatterRegistry = {
  event: { typeGuard: isErrorEvent, format: formatError },
  log: { typeGuard: isLogEvent, format: formatLog },
  metric: { typeGuard: isMetricEvent, format: formatMetric },
  transaction: { typeGuard: isTraceEvent, format: formatTrace },
};
