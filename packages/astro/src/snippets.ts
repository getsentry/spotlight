import type { SpotlightInitOptions } from "@spotlightjs/spotlight/vite-plugin";

export const buildServerSnippet: (options?: SpotlightInitOptions) => string = options => `
import * as _SentrySDKForSpotlight from '@sentry/astro';

if (_SentrySDKForSpotlight && _SentrySDKForSpotlight.getClient()) {
  _SentrySDKForSpotlight.addIntegration(_SentrySDKForSpotlight.spotlightIntegration({
    ${options?.sidecarUrl ? `sidecarUrl: '${options.sidecarUrl}'` : ""}
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
