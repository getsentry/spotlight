import { formatTimestamp, getDuration, mapFields, mapSdkFields, mapTags } from "../utils.js";

/**
 * Build error event data object.
 * Used by both logfmt and json formatters.
 */
export function buildErrorData(event: any): Record<string, any> {
  const data: Record<string, any> = {
    timestamp: formatTimestamp(event.timestamp),
    type: "error",
    level: event.level || "error",
    event_id: event.event_id,
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
      const frame = frames.find((f: any) => f.in_app) || frames[frames.length - 1];
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

  return data;
}

/**
 * Build log event data object.
 * Used by both logfmt and json formatters.
 */
export function buildLogData(log: any): Record<string, any> {
  const data: Record<string, any> = {
    timestamp: formatTimestamp(log.timestamp),
    type: "log",
    level: log.level,
  };

  mapFields(log, data, {
    message: "body",
    trace_id: "trace_id",
    severity_number: "severity_number",
  });

  if (log.attributes) {
    for (const [key, attr] of Object.entries(log.attributes)) {
      data[key] = (attr as any).value;
    }
  }

  return data;
}

/**
 * Build trace/transaction event data object.
 * Used by both logfmt and json formatters.
 */
export function buildTraceData(event: any): Record<string, any> {
  const data: Record<string, any> = {
    timestamp: formatTimestamp(event.timestamp),
    type: "trace",
    event_id: event.event_id,
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
      if ((measurement as any)?.value !== undefined) {
        data[`measurement.${key}`] = (measurement as any).value;
      }
    }
  }

  mapTags(event, data);

  return data;
}
