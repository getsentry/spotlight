import type { StreamableHTTPTransport } from "@hono/mcp";
import { getContext } from "hono/context-storage";
import { MessageBuffer } from "./messageBuffer.js";

export type Payload = [string, Buffer];
export type IncomingPayloadCallback = (body: string) => void;

export type HonoEnv = {
  Variables: {
    contextId: string;
    transport: StreamableHTTPTransport;
    basePath?: string;
    incomingPayload?: IncomingPayloadCallback;
  };
};

const contextBasedBuffer = new Map<string, MessageBuffer<Payload>>();

export function getBuffer(contextId?: string) {
  const ctxId = contextId ?? getContext<HonoEnv>().get("contextId");
  if (!ctxId) {
    throw new Error("No context ID found");
  }

  let buffer = contextBasedBuffer.get(ctxId);
  if (!buffer) {
    buffer = new MessageBuffer<Payload>();
    contextBasedBuffer.set(ctxId, buffer);
  }

  return buffer;
}
