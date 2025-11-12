import { MessageBuffer } from "../messageBuffer.ts";
import type { EventContainer } from "./eventContainer.ts";

const GLOBAL_BUFFER = new MessageBuffer<EventContainer>();

export function getBuffer() {
  return GLOBAL_BUFFER;
}
