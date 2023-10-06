import type { Envelope } from "@sentry/types";

import type { Integration } from "../integration";

export default function sentryIntegration() {
  return {
    name: "sentry",
    version: "1.0.0",
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

function serializeEnvelope(envelope: Envelope): string {
  const [envHeaders, items] = envelope;

  // Initially we construct our envelope as a string and only convert to binary chunks if we encounter binary data
  const parts: string[] = [];
  parts.push(JSON.stringify(envHeaders));

  for (const item of items) {
    const [itemHeaders, payload] = item;

    parts.push(`\n${JSON.stringify(itemHeaders)}\n`);

    parts.push(JSON.stringify(payload));
  }

  return parts.join("");
}
