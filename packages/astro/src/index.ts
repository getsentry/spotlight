import type { SpotlightInitOptions } from '@spotlightjs/spotlight/vite-plugin';
import type { AstroConfig, AstroIntegration } from 'astro';
import { buildServerSnippet } from './snippets';

import path from 'node:path';
import url from 'node:url';

import spotlight, { buildClientInit } from '@spotlightjs/spotlight/vite-plugin';

// type AstroConfigWithExperimentalDevOverlay = AstroConfig & {
//   experimental?: {
//     /**
//      * This used to be the way of enabling the dev overlay pre Astro 4.x
//      */
//     devOverlay?: boolean;
//   };
// };

const createPlugin = (options?: SpotlightInitOptions): AstroIntegration => {
  return {
    name: '@spotlightjs/astro',

    hooks: {
      'astro:config:setup': async ({ command, injectScript, addDevToolbarApp, logger, config }) => {
        if (command === 'dev') {
          logger.info('[@spotlightjs/astro] Setting up Spotlight');
          const showTriggerButton = !config.devToolbar?.enabled;
          // @ts-ignore
          config.vite.plugins = [spotlight({ showTriggerButton, ...options }), ...(config.vite.plugins || [])];

          injectScript('page-ssr', buildServerSnippet(options));

          const importPath = path.dirname(url.fileURLToPath(import.meta.url));
          const pluginPath = path.join(importPath, 'overlay/index.ts');

          addDevToolbarApp(pluginPath);
        } else if (options?.__debugOptions) {
          injectScript('page', buildClientInit(options));
        }
      },
    },
  };
};

export default createPlugin;
