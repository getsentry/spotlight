import { getContext } from "hono/context-storage";
import type { HonoEnv } from "~/types/index.js";
import { MessageBuffer } from "../messageBuffer.js";
import type { EventContainer } from "./eventContainer.js";

const contextBasedBuffer = new Map<string, MessageBuffer<EventContainer>>();

export function getBuffer(contextId?: string) {
  const ctxId = contextId ?? getContext<HonoEnv>().get("contextId");
  if (!ctxId) {
    throw new Error("No context ID found");
  }

  let buffer = contextBasedBuffer.get(ctxId);
  if (!buffer) {
    buffer = new MessageBuffer<EventContainer>();
    contextBasedBuffer.set(ctxId, buffer);
  }

  return buffer;
}
