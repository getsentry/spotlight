import type { HttpBindings } from "@hono/node-server";
import type { IncomingPayloadCallback } from "./utils.ts";

export type HonoEnv = {
  Bindings: HttpBindings;
  Variables: {
    contextId: string;
    basePath?: string;
    incomingPayload?: IncomingPayloadCallback;
  };
};
