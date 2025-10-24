import logfmt from "logfmt";
import type { SentryTransactionEvent } from "../../parser/index.js";
import { formatTimestamp, mapFields, mapSdkFields, mapTags } from "../utils.js";

export function formatTrace(event: SentryTransactionEvent): string {
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

  const { timestamp, start_timestamp } = event;
  if (typeof timestamp === "number" && typeof start_timestamp === "number") {
    data.duration_ms = Math.round((timestamp - start_timestamp) * 1000);
  }

  if (
    event.timestamp !== undefined &&
    event.start_timestamp !== undefined &&
    Number.isFinite(event.timestamp) &&
    Number.isFinite(event.start_timestamp)
  ) {
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
