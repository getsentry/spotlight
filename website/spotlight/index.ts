import type { AstroConfig, AstroIntegration, AstroIntegrationLogger, AstroRenderer, ClientDirectiveConfig, InjectedRoute, InjectedScriptStage } from 'astro';
import type { AddressInfo } from 'node:net';
import type * as vite from 'vite';
import { setupSidecar } from '@sentry/spotlight/sidecar'; 

const PKG_NAME = '@sentry/spotlight';

const createPlugin = (options?: {}): AstroIntegration => {
	let config: AstroConfig;
	// const logger = new Logger(PKG_NAME);

	return {
		name: PKG_NAME,

		hooks: {
            'astro:config:setup': async (options: {
                config: AstroConfig;
                command: 'dev' | 'build' | 'preview';
                isRestart: boolean;
                updateConfig: (newConfig: Record<string, any>) => void;
                addRenderer: (renderer: AstroRenderer) => void;
                addWatchFile: (path: URL | string) => void;
                injectScript: (stage: InjectedScriptStage, content: string) => void;
                injectRoute: (injectRoute: InjectedRoute) => void;
                addClientDirective: (directive: ClientDirectiveConfig) => void;
                logger: AstroIntegrationLogger;
            }) => {
                console.log('@sentry/spotlight astro:config:setup ------------');
                console.log(options.config.integrations[0].hooks['astro:config:setup']);
                if (options.command === 'dev') {
                    options.injectScript('page', `import * as Spotlight from '@sentry/spotlight'; Spotlight.init({integrations: [Spotlight.sentry()]});`);
                }
                
                // console.log(options);
              },
			'astro:config:done': async ({ config: cfg }) => {
                console.log('astro:config:done ------------');
				// config = cfg;
                // console.log(config);
			},

			'astro:build:done': async ({ dir, routes, pages }) => {
                console.log('astro:build:done ------------');
				// console.log(dir, routes, pages);
			},


            'astro:server:start': async (options: { address: AddressInfo; logger: AstroIntegrationLogger; }) => {
                console.log('astro:server:start ------------');
                setupSidecar();
            },

            'astro:server:done': async (options: { logger: AstroIntegrationLogger; }) => {
                console.log('astro:server:done ------------');
            },

            'astro:server:setup': async (options: { server: vite.ViteDevServer; logger: AstroIntegrationLogger; }) => {
                console.log('astro:server:setup ------------');
                // console.log(options);
            },

            'astro:build:generated': async (options: { dir: URL; logger: AstroIntegrationLogger; }) => {
                console.log('astro:build:generated ------------');
                // console.log(options);
            }

		},
	};
};

export default createPlugin;