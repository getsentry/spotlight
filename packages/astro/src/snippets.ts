export const SPOTLIGHT_CLIENT_INIT = `
import { init, sentry, console, viteInspect } from '@spotlightjs/astro'; 

init({
  integrations: [
    sentry(), 
    console(),
    viteInspect()
  ],
  showTriggerButton: false,
});
`;

export const SPOTLIGHT_SERVER_SNIPPET = `
function serializeEnvelope(envelope) {
  const [envHeaders, items] = envelope;

  // Initially we construct our envelope as a string and only convert to binary chunks if we encounter binary data
  const parts = [];
  parts.push(JSON.stringify(envHeaders));

  for (const item of items) {
    const [itemHeaders, payload] = item;

    parts.push('\\n' + JSON.stringify(itemHeaders)+ '\\n');

    parts.push(JSON.stringify(payload));
  }

  return parts.join("");
}

// A very hacky way to hook into Sentry's SDK
// but we love hacks
console.log('[Spotlight]', globalThis.__SENTRY__);
(globalThis).__SENTRY__.hub._stack[0].client.setupIntegrations(true);
(globalThis).__SENTRY__.hub._stack[0].client.on(
  "beforeEnvelope",
  (envelope) => {
    fetch("http://localhost:8969/stream", {
      method: "POST",
      body: serializeEnvelope(envelope),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
      mode: "cors",
    }).catch((err) => {
      console.error('[Spotlight]', err);
    });
  }
);

`;
