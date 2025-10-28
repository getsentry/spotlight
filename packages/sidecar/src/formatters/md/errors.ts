import type { EnvelopeItem } from "@sentry/core";
import type { z } from "zod";
import { type SentryEvent, isErrorEvent } from "~/parser/index.js";
import type { EventContainer } from "~/utils/index.js";
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
      formatted.push(...formatError(payload));
    }
  }

  return formatted;
}

export function processErrorEvent(event: any): z.infer<typeof ErrorEventSchema> {
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

  const message = typeof event.message === "string" ? event.message : (event.message?.formatted ?? "");

  return {
    message,
    id: event.event_id ?? "",
    type: "error" as const,
    culprit: event.culprit ?? null,
    tags: Object.entries(event.tags ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    dateCreated: formatTimestamp(event.timestamp),
    title: message,
    entries,
    contexts: event.contexts as any,
    platform: event.platform,
  };
}

/**
 * Format an error event to markdown string
 */
export function formatError(payload: EnvelopeItem[1]): string[] {
  // Type guard: error events are identified by the 'event' type in the envelope
  // and must have an exception property
  if (!payload || typeof payload !== "object") {
    throw new Error(`MD error formatter received invalid payload: expected object, got ${typeof payload}`);
  }

  const event = payload as SentryEvent;
  if (!isErrorEvent(event)) {
    throw new Error(`MD error formatter received non-error event: type=${(event as any).type}, has exception=${!!(event as any).exception}`);
  }

  return [formatEventOutput(processErrorEvent(event))];
}
