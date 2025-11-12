import { isErrorEvent, isLogEvent, isTraceEvent } from "@spotlight/server/parser/helpers.js";
import type { FormatterRegistry } from "../types.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

export const formatters: FormatterRegistry = {
  event: { typeGuard: isErrorEvent, format: formatError },
  log: { typeGuard: isLogEvent, format: formatLog },
  transaction: { typeGuard: isTraceEvent, format: formatTrace },
};
