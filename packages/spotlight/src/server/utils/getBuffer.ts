import { createSpotlightBuffer } from "../sdk.ts";

const GLOBAL_BUFFER = createSpotlightBuffer();

export function getBuffer() {
  return GLOBAL_BUFFER;
}
