import { formatEventOutput } from "~/formatting.js";
import { isErrorEvent, processErrorEvent } from "~/processing.js";
import type { EventContainer } from "../../../utils/eventContainer.js";
import { processEnvelope } from "../parsing.js";

export async function formatErrorEnvelope(container: EventContainer) {
  const event = processEnvelope({ contentType: container.getContentType(), data: container.getData() });

  const {
    envelope: [, items],
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
