export const SPOTLIGHT_CLIENT_INIT = `
import * as Spotlight from '@sentry/spotlight'; 

Spotlight.init({
  integrations: [
    Spotlight.sentry(), 
    Spotlight.console()
  ],
  showTriggerButton: false,
});

setTimeout(() => {
  console.log("this message should show up in the Spotlight Console tab eventually")
}, 3000);

setTimeout(() => {
  console.log("this one, too ;)")
}, 6000);

setTimeout(() => {
  console.warn("this warning, too ;)")
}, 6000);
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

setTimeout(() => {
  Sentry.captureMessage('does this now show up in spotlight?');
}, 2000);
`;
