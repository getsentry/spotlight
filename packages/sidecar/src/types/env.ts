import type { HttpBindings } from "@hono/node-server";
import type { IncomingPayloadCallback, OnEnvelopeCallback } from "./utils.js";

export type HonoEnv = {
  Bindings: HttpBindings;
  Variables: {
    contextId: string;
    basePath?: string;
    incomingPayload?: IncomingPayloadCallback;
    onEnvelope?: OnEnvelopeCallback;
  };
};
