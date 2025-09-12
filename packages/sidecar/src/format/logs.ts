import type { SerializedLog } from "@sentry/core";
import { isLogEvent } from "~/parser/index.js";
import type { EventContainer } from "~/utils/index.js";

export async function formatLogEnvelope(container: EventContainer) {
  const parsedEnvelope = container.getParsedEnvelope();

  const {
    event: [, items],
  } = parsedEnvelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "log" && isLogEvent(payload)) {
      for (const log of payload.items) {
        formatted.push(processLogEvent(log));
      }
    }
  }

  return formatted;
}

export function processLogEvent(event: SerializedLog): string {
  let attr = "";
  for (const [key, property] of Object.entries(event.attributes ?? {})) {
    if (key.startsWith("sentry.")) {
      continue;
    }

    attr += `${key}: ${property.value} (${property.type})\n`;
  }

  return `${new Date(event.timestamp * 1000).toISOString()} ${event.level} ${event.body}
Attributes:
${attr}`;
}
