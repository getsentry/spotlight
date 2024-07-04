import { buildSpotlightErrorPageSnippet } from '../snippets';

import type { Plugin } from 'vite';
import type { SpotlightAstroIntegrationOptions } from '../types';

type ErrorPagePluginOptions = {
  importPath: string;
} & SpotlightAstroIntegrationOptions;

export const errorPageInjectionPlugin: (options: ErrorPagePluginOptions) => Plugin = options => {
  return {
    name: 'spotlight-vite-client-snippet-plugin',
    transform(code, id, opts = {}) {
      if (opts.ssr) return;
      if (!id.includes('vite/dist/client/client.mjs')) return;

      const initSnippet = buildSpotlightErrorPageSnippet({
        ...options,
        // Astro's toolbar isn't available in the error page
        showTriggerButton: false,
        fullPage: true,
        // don't wait for the window.load event to be fired because in the error page,
        // this already happened before spotlight is initialized
        injectImmediately: true,
      });

      // Checking if there is a ErrorOverlay class added by Astro
      if (code.includes('class ErrorOverlay extends HTMLElement')) {
        const modifiedCode = code.replace(/class\s+ErrorOverlay\s+extends\s+HTMLElement\s*{/, match => {
          return match + '\n\tconnectedCallback() { this.close(); }\n';
        });

        return `${modifiedCode}\n${initSnippet}\n`;
      }

      return `${code}\n${initSnippet}\n`;
    },
  };
};
