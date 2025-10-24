import logfmt from "logfmt";
import type { SentryTransactionEvent } from "../../parser/index.js";

export function formatTrace(event: SentryTransactionEvent): string {
  const data: Record<string, any> = {
    type: "trace",
    event_id: event.event_id,
  };

  if (Number.isFinite(event.timestamp)) {
    data.timestamp = new Date(event.timestamp * 1000).toISOString();
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

  if (event.transaction) data.transaction = event.transaction;

  if (Number.isFinite(event.timestamp) && Number.isFinite(event.start_timestamp)) {
    data.duration_ms = Math.round((event.timestamp - event.start_timestamp) * 1000);
  }

  if (event.spans?.length) data.span_count = event.spans.length;

  if (event.environment) data.environment = event.environment;
  if (event.release) data.release = event.release;

  if (event.platform) data.platform = event.platform;
  if (event.sdk?.name) {
    data.sdk = event.sdk.name;
    if (event.sdk.version) data.sdk_version = event.sdk.version;
  }

  if (event.server_name) data.server_name = event.server_name;

  if (event.measurements) {
    for (const [key, measurement] of Object.entries(event.measurements)) {
      if (measurement?.value !== undefined) {
        data[`measurement_${key}`] = measurement.value;
      }
    }
  }

  if (event.tags) {
    for (const [key, value] of Object.entries(event.tags)) {
      data[`tag_${key}`] = value;
    }
  }

  return logfmt.stringify(data);
}
