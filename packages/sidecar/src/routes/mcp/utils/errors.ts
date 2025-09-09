import type { ErrorEvent } from "@sentry/core";
import type { z } from "zod";
import type { EventContainer } from "~/utils/eventContainer.js";
import { formatEventOutput } from "../formatting.js";
import { processEnvelope } from "../parsing/index.js";
import type { ErrorEventSchema } from "../schema.js";

export async function formatErrorEnvelope(container: EventContainer) {
  const event = processEnvelope({ contentType: container.getContentType(), data: container.getData() });

  const {
    event: [, items],
  } = event;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload)) {
      formatted.push(formatEventOutput(processErrorEvent(payload)));
    }
  }

  return formatted;
}

function isErrorEvent(payload: unknown): payload is ErrorEvent {
  return typeof payload === "object" && payload !== null && "exception" in payload;
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
    dateCreated: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
    title: event.message ?? "",
    entries,
    // @ts-expect-error
    contexts: event.contexts,
    platform: event.platform,
  };
}
