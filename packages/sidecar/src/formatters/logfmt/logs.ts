import type { SerializedLog } from "@sentry/core";
import logfmt from "logfmt";
import { formatTimestamp, mapFields } from "../utils.js";

export function formatLog(log: SerializedLog): string {
  const data: Record<string, any> = {
    timestamp: formatTimestamp(log.timestamp),
    level: log.level,
    type: "log",
  };

  mapFields(log, data, {
    message: "body",
    trace_id: "trace_id",
    severity_number: "severity_number",
  });

  if (log.attributes) {
    for (const [key, attr] of Object.entries(log.attributes)) {
      if (!key.startsWith("sentry.")) {
        data[key] = attr.value;
      }
    }
  }

  return logfmt.stringify(data);
}
