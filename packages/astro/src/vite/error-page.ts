import { getClientModulePath, sourceContextMiddleware } from '@spotlightjs/spotlight/vite-plugin';
import { buildSpotlightErrorPageSnippet } from '../snippets';

import type { PluginOption } from 'vite';
import type { SpotlightAstroIntegrationOptions } from '../types';

export const errorPageInjectionPlugin: (options: SpotlightAstroIntegrationOptions) => PluginOption = options => {
  let spotlightPath: string;
  return {
    name: 'spotlight-vite-client-error-plugin',
    configureServer(server) {
      spotlightPath = getClientModulePath('@spotlightjs/spotlight', server);

      server.middlewares.use(sourceContextMiddleware);
    },
    transform(code, id, opts = {}) {
      if (opts.ssr) return;
      if (!id.includes('vite/dist/client/client.mjs')) return;

      const initSnippet = buildSpotlightErrorPageSnippet({
        ...options,
        importPath: spotlightPath,
        // Astro's toolbar isn't available in the error page
        showTriggerButton: false,
        fullPage: true,
        // don't wait for the window.load event to be fired because in the error page,
        // this already happened before spotlight is initialized
        injectImmediately: true,
      });

      return `${code}\n${initSnippet}\n`;
    },
  };
};
