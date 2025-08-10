import type { ErrorEvent } from "@sentry/core";
import type { z } from "zod";
import type { ErrorEventSchema } from "./schema.js";

export function isErrorEvent(payload: unknown): payload is ErrorEvent {
  return typeof payload === "object" && payload !== null && "exception" in payload;
}

export function processErrorEvent(event: ErrorEvent): z.infer<typeof ErrorEventSchema> {
  const entries = [] as Array<{
    type: "exception" | "request" | "breadcrumbs" | "spans" | "threads";
    data: unknown;
  }>;

  if (event.exception) {
    entries.push({ type: "exception", data: event.exception });
  }

  if (event.request) {
    entries.push({ type: "request", data: event.request });
  }

  if (event.breadcrumbs) {
    entries.push({ type: "breadcrumbs", data: event.breadcrumbs });
  }

  if (event.spans) {
    entries.push({ type: "spans", data: event.spans });
  }

  if (event.threads) {
    entries.push({ type: "threads", data: event.threads });
  }

  return {
    message: event.message ?? "",
    id: event.event_id ?? "",
    type: "error",
    tags: Object.entries(event.tags ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    dateCreated: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
    title: event.message ?? "",
    entries,
    // @ts-expect-error contexts shape differs per platform
    contexts: event.contexts,
    platform: event.platform,
  };
}
