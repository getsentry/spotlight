import type { ErrorEvent } from "@sentry/core";
import logfmt from "logfmt";

export function formatError(event: ErrorEvent): string {
  const data: Record<string, any> = {
    type: "error",
    event_id: event.event_id,
    timestamp: event.timestamp ? new Date(event.timestamp * 1000).toISOString() : new Date().toISOString(),
    level: event.level || "error",
  };

  const message = event.message || event.logentry?.message;
  if (message) {
    data.message = message;
  }

  const exc = event.exception?.values?.[0];
  if (exc) {
    if (exc.type) data.exception_type = exc.type;
    if (exc.value) data.exception_value = exc.value;

    const frames = exc.stacktrace?.frames;
    if (frames && frames.length > 0) {
      const frame = frames.find(f => f.in_app) || frames[frames.length - 1];
      if (frame.filename) data.filename = frame.filename;
      if (frame.lineno) data.lineno = frame.lineno;
      if (frame.colno) data.colno = frame.colno;
      if (frame.function) data.function = frame.function;
    }
  }

  if (event.contexts?.trace?.trace_id) {
    data.trace_id = event.contexts.trace.trace_id;
    if (event.contexts.trace.span_id) {
      data.span_id = event.contexts.trace.span_id;
    }
  }

  if (event.environment) data.environment = event.environment;
  if (event.release) data.release = event.release;
  if (event.dist) data.dist = event.dist;

  if (event.platform) data.platform = event.platform;
  if (event.sdk?.name) {
    data.sdk = event.sdk.name;
    if (event.sdk.version) data.sdk_version = event.sdk.version;
  }

  if (event.transaction) data.transaction = event.transaction;

  if (event.user?.id) data.user_id = event.user.id;
  if (event.user?.email) data.user_email = event.user.email;
  if (event.user?.username) data.user_username = event.user.username;

  if (event.request?.url) data.request_url = event.request.url;
  if (event.request?.method) data.request_method = event.request.method;

  if (event.logger) data.logger = event.logger;
  if (event.server_name) data.server_name = event.server_name;

  if (event.breadcrumbs?.length) data.breadcrumb_length = event.breadcrumbs.length;
  if (event.spans?.length) data.span_length = event.spans.length;

  if (event.tags) {
    for (const [key, value] of Object.entries(event.tags)) {
      data[`tag_${key}`] = value;
    }
  }

  return logfmt.stringify(data);
}
