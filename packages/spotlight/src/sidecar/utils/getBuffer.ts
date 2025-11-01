import { MessageBuffer } from "../messageBuffer.js";
import type { EventContainer } from "./eventContainer.js";

const GLOBAL_BUFFER = new MessageBuffer<EventContainer>();

export function getBuffer() {
  return GLOBAL_BUFFER;
}
