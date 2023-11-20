import type { AstroIntegration } from 'astro';
import { SPOTLIGHT_SERVER_SNIPPET, buildClientInitSnippet, buildSpotlightErrorPageSnippet } from './snippets';

import path from 'path';
import url from 'url';

const PKG_NAME = '@spotlightjs/astro';

const createPlugin = (): AstroIntegration => {
  const thisFilePath = url.fileURLToPath(import.meta.url);
  return {
    name: PKG_NAME,

    hooks: {
      'astro:config:setup': async ({ command, injectScript, addDevOverlayPlugin, logger, config }) => {
        logger.info('[@spotlightjs/astro] Setting up Spotlight');

        if (command === 'dev') {
          config.vite.plugins = [
            {
              name: 'spotlight-vite-client-snippet-plugin',
              transform(code, id, opts = {}) {
                if (opts.ssr) return;
                if (!id.includes('vite/dist/client/client.mjs')) return;

                const initSnippet = buildSpotlightErrorPageSnippet({
                  importPath: thisFilePath,
                  // Astro's toolbar isn't available in the error page
                  showTriggerButton: true,
                  // don't wait for the window.load event to be fired because in the error page,
                  // this already happened before spotlight is initialized
                  injectImmediately: true,
                });

                const modifiedCode = `${code}\n${initSnippet}\n`;

                return modifiedCode;
              },
            },
            ...(config.vite.plugins || []),
          ];

          injectScript('page', buildClientInitSnippet({ importPath: PKG_NAME, showTriggerButton: false }));
          injectScript('page-ssr', SPOTLIGHT_SERVER_SNIPPET);
        }

        const importPath = path.dirname(url.fileURLToPath(import.meta.url));
        const pluginPath = path.join(importPath, 'overlay/index.ts');
        addDevOverlayPlugin(pluginPath);
      },
      'astro:server:start': async () => {
        // Importing this dynamically because for some reason, the top level import
        // caused a dev server error because sidecar code was bundled into the server
        const { setupSidecar } = await import('@spotlightjs/sidecar');
        setupSidecar();
      },
    },
  };
};

export default createPlugin;

export * from '@spotlightjs/core';
