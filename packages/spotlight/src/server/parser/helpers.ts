import type {
  SentryErrorEvent,
  SentryEvent,
  SentryLogEvent,
  SentryProfileV1Event,
  SentryTransactionEvent,
} from "./types.js";

export const ERROR_EVENT_TYPES = new Set(["event", "error"]);
export const TRACE_EVENT_TYPES = new Set(["transaction"]);
export const PROFILE_EVENT_TYPES = new Set(["profile"]);
export const LOG_EVENT_TYPES = new Set(["log"]);
export const SUPPORTED_EVENT_TYPES = new Set([
  ...ERROR_EVENT_TYPES,
  ...TRACE_EVENT_TYPES,
  ...PROFILE_EVENT_TYPES,
  ...LOG_EVENT_TYPES,
]);

export function isErrorEvent(event: SentryEvent): event is SentryErrorEvent {
  const hasValidType = !event.type || ERROR_EVENT_TYPES.has(event.type);
  const hasException = Boolean((event as SentryErrorEvent).exception);
  const hasMessage = Boolean((event as SentryErrorEvent).message);
  return hasValidType && (hasException || hasMessage);
}

export function isProfileEvent(event: SentryEvent): event is SentryProfileV1Event {
  return !!event.type && PROFILE_EVENT_TYPES.has(event.type) && (event as SentryProfileV1Event).version === "1";
}

export function isTraceEvent(event: SentryEvent): event is SentryTransactionEvent {
  return !!event.type && TRACE_EVENT_TYPES.has(event.type);
}

export function isLogEvent(event: SentryEvent): event is SentryLogEvent {
  return !!event.type && LOG_EVENT_TYPES.has(event.type);
}
