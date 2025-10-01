import { isErrorEvent, isLogEvent } from "~/parser/index.js";
import type { EventContainer } from "~/utils/index.js";
import { processErrorEvent } from "./errors.js";
import { formatEventOutput } from "./event.js";
import { processLogEvent } from "./logs.js";

export const eventHanlers = {
  error: payload => formatEventOutput(processErrorEvent(payload)),
  log: payload => {
    const content: string[] = [];
    for (const log of payload.items) {
      content.push(processLogEvent(log));
    }
    return content;
  },
};

export function formatEnvelope(container: EventContainer) {
  const processedEnvelope = container.getParsedEnvelope();

  const {
    event: [, items],
  } = processedEnvelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload)) {
      formatted.push(eventHanlers.error(payload));
    } else if (type === "log" && isLogEvent(payload)) {
      formatted.push(...eventHanlers.log(payload));
    }
  }

  return formatted;
}
