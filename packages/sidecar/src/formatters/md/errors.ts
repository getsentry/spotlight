import type { ErrorEvent } from "@sentry/core";
import type { z } from "zod";
import { type SentryEvent, isErrorEvent } from "../../parser/index.js";
import type { EventContainer } from "../../utils/index.js";
import type { ErrorEventSchema } from "../schema.js";
import { formatTimestamp } from "../utils.js";
import { formatEventOutput } from "./event.js";

export function formatErrorEnvelope(container: EventContainer) {
  const processedEnvelope = container.getParsedEnvelope();

  const {
    envelope: [, items],
  } = processedEnvelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload as SentryEvent)) {
      formatted.push(...formatError(payload as ErrorEvent));
    }
  }

  return formatted;
}

export function processErrorEvent(event: ErrorEvent): z.infer<typeof ErrorEventSchema> {
  const entries: z.infer<typeof ErrorEventSchema>["entries"] = [];

  if (event.exception) {
    entries.push({
      type: "exception",
      data: event.exception,
    });
  }

  if (event.request) {
    entries.push({
      type: "request",
      data: event.request,
    });
  }

  if (event.breadcrumbs) {
    entries.push({
      type: "breadcrumbs",
      data: event.breadcrumbs,
    });
  }

  if (event.spans) {
    entries.push({
      type: "spans",
      data: event.spans,
    });
  }

  if (event.threads) {
    entries.push({
      type: "threads",
      data: event.threads,
    });
  }

  return {
    message: event.message ?? "",
    id: event.event_id ?? "",
    type: "error",
    tags: Object.entries(event.tags ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    dateCreated: formatTimestamp(event.timestamp),
    title: event.message ?? "",
    entries,
    // @ts-expect-error
    contexts: event.contexts,
    platform: event.platform,
  };
}

/**
 * Format an error event to markdown string
 */
export function formatError(payload: ErrorEvent): string[] {
  return [formatEventOutput(processErrorEvent(payload))];
}
