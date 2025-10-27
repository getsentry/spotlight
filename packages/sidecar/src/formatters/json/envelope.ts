import type { ParsedEnvelope } from "../../parser/index.js";
import { isErrorEvent, isLogEvent, isTraceEvent } from "../../parser/index.js";
import { formatEnvelopeWithFormatter } from "../shared/envelope.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

export function formatEnvelope(envelope: ParsedEnvelope["envelope"]): string {
  return formatEnvelopeWithFormatter(
    envelope,
    { formatError, formatLog, formatTrace },
    { isErrorEvent, isLogEvent, isTraceEvent },
  );
}
