export const ERROR_EVENT_TYPES = new Set(["event", "error"]);
export const TRACE_EVENT_TYPES = new Set(["transaction"]);
export const PROFILE_EVENT_TYPES = new Set(["profile"]);
export const SUPPORTED_EVENT_TYPES = new Set([...ERROR_EVENT_TYPES, ...TRACE_EVENT_TYPES, ...PROFILE_EVENT_TYPES]);
