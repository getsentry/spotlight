import type { ErrorEvent } from "@sentry/core";
import logfmt from "logfmt";
import { formatTimestamp, mapFields, mapSdkFields, mapTags } from "../utils.js";

export function formatError(event: ErrorEvent): string {
  const data: Record<string, any> = {
    type: "error",
    event_id: event.event_id,
    timestamp: formatTimestamp(event.timestamp),
    level: event.level || "error",
  };

  const message = event.message || event.logentry?.message;
  if (message) {
    data.message = message;
  }

  const exc = event.exception?.values?.[0];
  if (exc) {
    mapFields(exc, data, {
      exception_type: "type",
      exception_value: "value",
    });

    const frames = exc.stacktrace?.frames;
    if (frames?.length) {
      const frame = frames.find(f => f.in_app) || frames[frames.length - 1];
      mapFields(frame, data, {
        filename: "filename",
        lineno: "lineno",
        colno: "colno",
        function: "function",
      });
    }
  }

  const trace = event.contexts?.trace;
  if (trace?.trace_id) {
    mapFields(trace, data, {
      trace_id: "trace_id",
      span_id: "span_id",
    });
  }

  mapFields(event, data, {
    environment: "environment",
    release: "release",
    dist: "dist",
    platform: "platform",
    transaction: "transaction",
    logger: "logger",
    server_name: "server_name",
    user_id: "user.id",
    user_email: "user.email",
    user_username: "user.username",
    request_url: "request.url",
    request_method: "request.method",
  });

  mapSdkFields(event, data);

  if (event.breadcrumbs?.length) data.breadcrumb_length = event.breadcrumbs.length;
  if (event.spans?.length) data.span_length = event.spans.length;
  mapTags(event, data);

  return logfmt.stringify(data);
}
