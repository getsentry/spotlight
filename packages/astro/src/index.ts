import type { AstroIntegration } from 'astro';
import { SPOTLIGHT_CLIENT_INIT, SPOTLIGHT_SERVER_SNIPPET } from './snippets';

import path from 'path';
import url from 'url';

const PKG_NAME = '@spotlightjs/astro';

const createPlugin = (): AstroIntegration => {
  return {
    name: PKG_NAME,

    hooks: {
      'astro:config:setup': async ({ command, injectScript, addDevOverlayPlugin, logger }) => {
        logger.info('[@spotlightjs/astro] Setting up Spotlight');
        if (command === 'dev') {
          injectScript('page', SPOTLIGHT_CLIENT_INIT);
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
