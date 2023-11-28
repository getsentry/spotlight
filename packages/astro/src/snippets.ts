import type { SpotlightAstroIntegrationOptions } from './types';

type SupportedIntegrations = 'sentry' | 'console' | 'viteInspect';

export type ClientInitOptions = {
  importPath: string;
  showTriggerButton?: boolean;
  integrationNames?: SupportedIntegrations[];
  injectImmediately?: boolean;
} & SpotlightAstroIntegrationOptions;

const DEFAULT_INTEGRATIONS = ['sentry'];

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

type ServerSnippetOptions = {
  sidecarUrl?: string;
};

export const buildServerSnippet: (options: ServerSnippetOptions) => string = ({ sidecarUrl }) => `
import * as _SentrySDKForSpotlight from '@sentry/astro';

_SentrySDKForSpotlight.getClient().setupIntegrations(true);
_SentrySDKForSpotlight.addIntegration(new _SentrySDKForSpotlight.Integrations.Spotlight({
  ${sidecarUrl ? `sidecarUrl: '${sidecarUrl}'` : ''}
}));
`;
