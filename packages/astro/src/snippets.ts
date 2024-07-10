import { getClientModulePath } from '@spotlightjs/spotlight/vite-plugin';

import type { SpotlightAstroIntegrationOptions } from './types';

type SupportedIntegrations = 'sentry' | 'console' | 'viteInspect';

export type ClientInitOptions = {
  importPath?: string;
  showTriggerButton?: boolean;
  integrationNames?: SupportedIntegrations[];
  injectImmediately?: boolean;
  fullPage?: boolean;
} & SpotlightAstroIntegrationOptions;

const buildClientImport = (importPath?: string) =>
  `import * as Spotlight from ${JSON.stringify(
    '/@fs/' + (importPath || getClientModulePath('@spotlightjs/spotlight')),
  )};`;

const buildClientInit = (options: ClientInitOptions) => {
  let initOptions = JSON.stringify({
    showTriggerButton: options.showTriggerButton !== false,
    injectImmediately: options.injectImmediately,
    debug: options.debug,
    sidecarUrl: options.sidecarUrl,
    fullPage: options.fullPage,
  });

  const integrationOptions = JSON.stringify({ sidecarUrl: options.sidecarUrl, openLastError: options.fullPage });
  const integrations = (options.integrationNames || ['sentry']).map(i => `Spotlight.${i}(${integrationOptions})`);
  initOptions = `{integrations: [${integrations.join(', ')}], ${initOptions.slice(1)}`;

  return `Spotlight.init(${initOptions});`;
};

export const buildClientInitSnippet = (options: ClientInitOptions) => {
  console.log(options);

  return `
${buildClientImport(options.importPath)}
${buildClientInit(options)}
`;
};

/**
 * Hook into Vite's client code to enable Spotlight if an error occurs.
 *
 * Main difference to normal page injection: We only initialize spotlight
 * if an error happens.
 *
 * Hacked `createErrorOverlay` from Vite's client code:
 * @see https://github.com/vitejs/vite/blob/b9ee620108819e06023e4303af75a61d3e4e4d76/packages/vite/src/client/client.ts#L291
 */
export const buildSpotlightErrorPageSnippet = (options: ClientInitOptions) => `
${buildClientImport(options.importPath)}
createErrorOverlay = function(err) {
  ${buildClientInit(options)}
};
`;

export const buildServerSnippet: (options: SpotlightAstroIntegrationOptions) => string = options => `
import * as _SentrySDKForSpotlight from '@sentry/astro';

if (_SentrySDKForSpotlight && _SentrySDKForSpotlight.getClient()) {
  _SentrySDKForSpotlight.addIntegration(_SentrySDKForSpotlight.spotlightIntegration({
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
