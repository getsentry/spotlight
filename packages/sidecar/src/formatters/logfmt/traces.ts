import logfmt from "logfmt";
import type { SentryTransactionEvent } from "../../parser/index.js";
import { formatTimestamp, mapFields, mapSdkFields, mapTags } from "../utils.js";

export function formatTrace(event: SentryTransactionEvent): string {
  const data: Record<string, any> = {
    type: "trace",
    event_id: event.event_id,
  };

  if (Number.isFinite(event.timestamp)) {
    data.timestamp = formatTimestamp(event.timestamp);
  }

  const trace = event.contexts?.trace;
  if (trace?.trace_id) {
    data.trace_id = trace.trace_id;
    if (trace.span_id) data.span_id = trace.span_id;
    if (trace.parent_span_id) data.parent_span_id = trace.parent_span_id;
    if (trace.op) data.op = trace.op;
    if (trace.status) data.status = trace.status;
    if (trace.description) data.description = trace.description;
  }

  if (Number.isFinite(event.timestamp) && Number.isFinite(event.start_timestamp)) {
    data.duration_ms = Math.round((event.timestamp - event.start_timestamp) * 1000);
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

  return logfmt.stringify(data);
}
