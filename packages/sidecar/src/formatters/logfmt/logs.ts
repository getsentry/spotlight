import type { SerializedLog } from "@sentry/core";
import logfmt from "logfmt";

export function formatLog(log: SerializedLog): string {
  const data: Record<string, any> = {
    timestamp: new Date(log.timestamp * 1000).toISOString(),
    level: log.level,
    type: "log",
  };

  if (log.body) {
    data.message = log.body;
  }

  if (log.trace_id) {
    data.trace_id = log.trace_id;
  }

  if (log.severity_number) {
    data.severity_number = log.severity_number;
  }

  if (log.attributes) {
    for (const [key, attr] of Object.entries(log.attributes)) {
      if (!key.startsWith("sentry.")) {
        data[key] = attr.value;
      }
    }
  }

  return logfmt.stringify(data);
}
