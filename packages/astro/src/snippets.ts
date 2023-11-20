type SupportedIntegrations = 'sentry' | 'console' | 'viteInspect';

type ClientInitOptions = {
  importPath: string;
  showTriggerButton?: boolean;
  integrationNames?: SupportedIntegrations[];
  injectImmediately?: boolean;
};

const DEFAULT_INTEGRATIONS = ['sentry', 'console', 'viteInspect'];

const buildClientImport = (importPath: string) => `import * as Spotlight from '${importPath}';`;

const buildClientInit = (options: ClientInitOptions) => {
  const integrations = options.integrationNames || DEFAULT_INTEGRATIONS;
  const integrationCalls = integrations.map(i => `Spotlight.${i}()`).join(', ');
  return `
Spotlight.init({
  integrations: [
    ${integrationCalls}
  ],
  showTriggerButton: ${options.showTriggerButton === false ? 'false' : 'true'},
  injectImmediately: ${options.injectImmediately === true ? 'true' : 'false'},
});
`;
};

export const buildClientInitSnippet = (options: ClientInitOptions) => `
${buildClientImport(options.importPath)}
${buildClientInit(options)}
`;

/**
 * Hook into Vite's client code to enable Spotlight if an error occurs.
 *
 * TODO: only init spotlight, if there isn't already a spotlight instance running!
 *       this could happen when the error overlay is shown after the pageload.
 *       For example, in an island performing an erroneous endpoint fetch
 *
 * - `enableOverlay` is defined in Vite's client code:
 *    @see https://github.com/vitejs/vite/blob/b9ee620108819e06023e4303af75a61d3e4e4d76/packages/vite/src/client/client.ts#L289
 * - `socket` is defined in Vite's client code and is used to communicate with the server:
 *    @see https://github.com/vitejs/vite/blob/b9ee620108819e06023e4303af75a61d3e4e4d76/packages/vite/src/client/client.ts#L67
 *
 */
export const buildSpotlightErrorPageSnippet = (options: ClientInitOptions) => `
${buildClientImport(options.importPath)}

if (enableOverlay) {
  socket.addEventListener('message', (event) => {
    const dataJson = JSON.parse(event.data);
    if (dataJson.type === 'error') {
      ${buildClientInit(options)}
    }
  });
}
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
