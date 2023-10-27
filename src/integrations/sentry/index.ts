import type { Envelope } from "@sentry/types";
import { serializeEnvelope } from "@sentry/utils";

import type { Integration } from "../integration";

const HEADER = "application/x-sentry-envelope";

export default function sentryIntegration() {
  return {
    name: "sentry",
    forwardedContentType: [HEADER],
    setup: () => {
      console.log("sentry integration init 2");
      hookIntoSentry();
    },
  } satisfies Integration;
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
          "Content-Type": HEADER,
        },
        mode: "cors",
      }).catch((err) => {
        console.error(err);
      });
    }
  );
}
