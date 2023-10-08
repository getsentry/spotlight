import type { Envelope } from "@sentry/types";
import { serializeEnvelope } from "@sentry/utils";

import type { Integration } from "../integration";

export default function sentryIntegration() {
  return {
    name: "sentry",
    hooks: {
      "spotlight:integration:init": () => {
        console.log("sentry integration init");
        hookIntoSentry();
      },
    },
  } as Integration;
}

function hookIntoSentry() {
  // A very hacky way to hook into Sentry's SDK
  // but we love hacks
  (window as any).__SENTRY__.hub._stack[0].client.setupIntegrations(true);
  (window as any).__SENTRY__.hub._stack[0].client.on(
    "beforeEnvelope",
    (envelope: Envelope) => {
      fetch("http://localhost:8969/stream", {
        method: "POST",
        body: serializeEnvelope(envelope),
        headers: {
          "Content-Type": "application/x-sentry-envelope",
        },
        mode: "cors",
      }).catch((err) => {
        console.error(err);
      });
    }
  );
}
