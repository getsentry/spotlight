import type { SerializedLog, SerializedLogContainer } from "@sentry/core";
import type { EventContainer } from "../../../utils/eventContainer.js";
import { processEnvelope } from "../parsing.js";

export async function formatLogEnvelope(container: EventContainer) {
  const event = processEnvelope({ contentType: container.getContentType(), data: container.getData() });

  const {
    envelope: [, items],
  } = event;

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

function isLogEvent(payload: unknown): payload is SerializedLogContainer {
  return typeof payload === "object" && payload !== null && "items" in payload;
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
