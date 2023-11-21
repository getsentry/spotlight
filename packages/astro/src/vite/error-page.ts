import { buildSpotlightErrorPageSnippet } from '../snippets';

import type { Plugin } from 'vite';

type ErrorPagePluginOptions = {
  importPath: string;
};

export const errorPageInjectionPlugin: (options: ErrorPagePluginOptions) => Plugin = ({ importPath }) => {
  return {
    name: 'spotlight-vite-client-snippet-plugin',
    transform(code, id, opts = {}) {
      if (opts.ssr) return;
      if (!id.includes('vite/dist/client/client.mjs')) return;

      const initSnippet = buildSpotlightErrorPageSnippet({
        importPath,
        // Astro's toolbar isn't available in the error page
        showTriggerButton: true,
        // don't wait for the window.load event to be fired because in the error page,
        // this already happened before spotlight is initialized
        injectImmediately: true,
      });

      const modifiedCode = `${code}\n${initSnippet}\n`;

      return modifiedCode;
    },
  };
};
