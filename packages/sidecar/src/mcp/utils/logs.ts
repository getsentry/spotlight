import type { SerializedLog } from "@sentry/core";
import { isLogEvent, processEnvelope } from "@spotlightjs/core/sentry";
import type { EventContainer } from "../../eventContainer.js";

export async function formatLogEnvelope(container: EventContainer) {
  const { event: envelope } = processEnvelope({ contentType: container.getContentType(), data: container.getData() });

  const [, items] = envelope;

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
