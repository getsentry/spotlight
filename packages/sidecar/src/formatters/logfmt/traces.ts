import logfmt from "logfmt";
import type { SentryTransactionEvent } from "../../parser/index.js";
import { formatTimestamp, getDuration, mapFields, mapSdkFields, mapTags } from "../utils.js";

export function formatTrace(event: SentryTransactionEvent): string[] {
  const data: Record<string, any> = {
    type: "trace",
    event_id: event.event_id,
    timestamp: formatTimestamp(event.timestamp),
  };

  const trace = event.contexts?.trace;
  if (trace?.trace_id) {
    mapFields(trace, data, {
      trace_id: "trace_id",
      span_id: "span_id",
      parent_span_id: "parent_span_id",
      op: "op",
      status: "status",
      description: "description",
    });
  }

  const duration = getDuration(event.timestamp, event.start_timestamp);
  if (duration !== undefined) {
    data.duration_ms = duration;
  }

  if (event.spans?.length) data.span_count = event.spans.length;

  mapFields(event, data, {
    transaction: "transaction",
    environment: "environment",
    release: "release",
    platform: "platform",
    server_name: "server_name",
  });

  mapSdkFields(event, data);

  if (event.measurements) {
    for (const [key, measurement] of Object.entries(event.measurements)) {
      if (measurement?.value !== undefined) {
        data[`measurement.${key}`] = measurement.value;
      }
    }
  }

  mapTags(event, data);

  return [logfmt.stringify(data)];
}
