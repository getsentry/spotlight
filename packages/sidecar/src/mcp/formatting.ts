import type { ErrorEvent } from "@sentry/core";

export function formatIssue(event: ErrorEvent) {
  return {
    exception: event.exception,
    level: event.level,
    request: event.request,
  };
}
