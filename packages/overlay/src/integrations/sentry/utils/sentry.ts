import { ERROR_EVENT_TYPES, PROFILE_EVENT_TYPES, TRACE_EVENT_TYPES } from '../constants/sentry';
import type { SentryErrorEvent, SentryEvent, SentryProfileV1Event, SentryTransactionEvent } from '../types';

export function isErrorEvent(event: SentryEvent): event is SentryErrorEvent {
  return (!event.type || ERROR_EVENT_TYPES.has(event.type)) && Boolean((event as SentryErrorEvent).exception);
}

export function isProfileEvent(event: SentryEvent): event is SentryProfileV1Event {
  return !!event.type && PROFILE_EVENT_TYPES.has(event.type) && (event as SentryProfileV1Event).version === '1';
}

export function isTraceEvent(event: SentryEvent): event is SentryTransactionEvent {
  return !!event.type && TRACE_EVENT_TYPES.has(event.type);
}
