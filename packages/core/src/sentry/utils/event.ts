import type { ErrorEvent, SerializedLogContainer } from "@sentry/core";
import { PROFILE_EVENT_TYPES, TRACE_EVENT_TYPES } from "../constants";
import type { SentryEvent, SentryProfileV1Event, SentryTransactionEvent } from "../types";

/**
 * Check if a Sentry event is an error event
 */
export function isErrorEvent(payload: unknown): payload is ErrorEvent {
  return typeof payload === "object" && payload !== null && "exception" in payload;
}

/**
 * Check if a Sentry event is a profile event
 */
export function isProfileEvent(event: SentryEvent): event is SentryProfileV1Event {
  return !!event.type && PROFILE_EVENT_TYPES.has(event.type) && (event as SentryProfileV1Event).version === "1";
}

/**
 * Check if a Sentry event is a trace event
 */
export function isTraceEvent(event: SentryEvent): event is SentryTransactionEvent {
  return !!event.type && TRACE_EVENT_TYPES.has(event.type);
}

/**
 * Check if a Sentry event is a log event
 */
export function isLogEvent(payload: unknown): payload is SerializedLogContainer {
  return typeof payload === "object" && payload !== null && "items" in payload;
}
