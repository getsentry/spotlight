import type { SpotlightAstroIntegrationOptions } from './types';

type SupportedIntegrations = 'sentry' | 'console' | 'viteInspect';

export type ClientInitOptions = {
  importPath: string;
  showTriggerButton?: boolean;
  integrationNames?: SupportedIntegrations[];
  injectImmediately?: boolean;
} & SpotlightAstroIntegrationOptions;

const buildClientImport = (importPath: string) => `import * as Spotlight from ${JSON.stringify(importPath)};`;

const buildClientInit = (options: ClientInitOptions) => {
  const integrationCalls = options.integrationNames
    ? options.integrationNames.map(i => `Spotlight.${i}()`).join(', ')
    : `Spotlight.sentry({sidecarUrl: ${options.sidecarUrl ? `'${options.sidecarUrl}'` : undefined}})`;

  return `
Spotlight.init({
  integrations: [
    ${integrationCalls}
  ],
  showTriggerButton: ${options.showTriggerButton === false ? 'false' : 'true'},
  injectImmediately: ${options.injectImmediately === true ? 'true' : 'false'},
  debug: ${options.debug === true ? 'true' : 'false'},
  ${options.sidecarUrl ? `sidecarUrl: '${options.sidecarUrl}'` : ''}
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
 * Main difference to normal page injection: We only initialize spotlight
 * if an error happens and is transmitted via the websocket. This is to avoid
 * initializing this spotlight instance before the actual app's instance.
 * This should only be  the fallback instance if the app failed to intialize.
 *
 * Used variables from Vite's client code:
 * - `enableOverlay` to check if the overlay should be shown
 *    @see https://github.com/vitejs/vite/blob/b9ee620108819e06023e4303af75a61d3e4e4d76/packages/vite/src/client/client.ts#L289
 * - `socket` to listen for incoming error events:
 *    @see https://github.com/vitejs/vite/blob/b9ee620108819e06023e4303af75a61d3e4e4d76/packages/vite/src/client/client.ts#L67
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

export const buildServerSnippet: (options: SpotlightAstroIntegrationOptions) => string = options => `
import * as _SentrySDKForSpotlight from '@sentry/astro';

if (_SentrySDKForSpotlight && _SentrySDKForSpotlight.getClient()) {
  _SentrySDKForSpotlight.getClient().setupIntegrations(true);
  _SentrySDKForSpotlight.addIntegration(new _SentrySDKForSpotlight.Integrations.Spotlight({
    ${options?.sidecarUrl ? `sidecarUrl: '${options.sidecarUrl}'` : ''}
  }));
} else {
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!! [@spotlightjs/astro] !!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('Could not find Sentry SDK. Please make sure to install it for the best experience.');
  console.log('Visit https://spotlightjs.com/setup/astro/ for detailed instructions.');
  console.log('');
  console.log('npx astro add @sentry/astro');
  console.log('');
  console.log('Also make sure in your astro.config.mjs to add the Sentry plugin before Spotlight: ');
  console.log('╭ astro.config.mjs ──────────────────────────────╮');
  console.log('│ import { defineConfig } from "astro/config";   │');
  console.log('│ import spotlightjs from "@spotlightjs/astro";  │');
  console.log('│ import sentry from "@sentry/astro";            │');
  console.log('│                                                │');
  console.log('│ // https://astro.build/config                  │');
  console.log('│ export default defineConfig({                  │');
  console.log('│   integrations: [sentry(), spotlightjs()]      │');
  console.log('│ });                                            │');
  console.log('╰────────────────────────────────────────────────╯');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!! [@spotlightjs/astro] !!!!!!!!!!!!!!!!!!!!!!!!!!!!');
}
`;
