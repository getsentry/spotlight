import { randomBytes } from 'node:crypto';
import type { ServerResponse } from 'node:http';

// Cannot use import.meta.resolve -- @see https://github.com/vitejs/vite/discussions/15871
import type { SpotlightOverlayOptions } from '@spotlightjs/overlay';
import { resolve } from 'import-meta-resolve';
import type { Connect, ErrorPayload, PluginOption, ViteDevServer } from 'vite';

import * as packageJson from '../package.json';
import { setupSidecar } from './sidecar';

const FILE_PROTOCOL_PREFIX_LENGTH = 'file://'.length;

export function getSpotlightClientModulePath({
  server,
  module = packageJson.name,
}: { server?: ViteDevServer; module?: string } = {}): string {
  const modulePath = resolve(module, import.meta.url)
    .slice(FILE_PROTOCOL_PREFIX_LENGTH)
    .split('?', 1)[0];
  if (server) {
    server.config.server.fs.allow.push(modulePath);
  }

  return modulePath;
}

export type SpotlightIntegration = 'sentry' | 'console' | 'viteInspect';

export type SpotlightInitOptions = {
  importPath?: string;
  integrationNames?: SpotlightIntegration[];
  port?: number;
  /**
   * Additional debug options.
   * WARNING: These options are not part of the public API and may change at any time.
   */
  __debugOptions?: Record<string, unknown>;
} & SpotlightOverlayOptions;

const serverOptions = new Set(['importPath', 'integrationNames', 'port']);

export function buildClientInit(options: SpotlightInitOptions) {
  const clientOptions = Object.fromEntries(
    Object.entries(options).filter(([key]) => !key.startsWith('_') && !serverOptions.has(key)),
  );
  let initOptions = JSON.stringify({
    ...clientOptions,
    showTriggerButton: options.showTriggerButton !== false,
    injectImmediately: options.injectImmediately !== false,
  });

  const integrationOptions = JSON.stringify({ openLastError: true });
  const integrations = (options.integrationNames || ['sentry']).map(i => `Spotlight.${i}(${integrationOptions})`);
  initOptions = `{integrations: [${integrations.join(', ')}], ${initOptions.slice(1)}`;

  return [
    `import * as Spotlight from ${JSON.stringify('/@fs' + (options.importPath || getSpotlightClientModulePath()))};`,
    `Spotlight.init(${initOptions});`,
    `window.createErrorOverlay=function createErrorOverlay(err) { Spotlight.openSpotlight(); };`,
  ].join('\n');
}

async function sendErrorToSpotlight(err: ErrorPayload['err'], spotlightUrl: string = 'http://localhost:8969/stream') {
  if (!err.errors) {
    console.log(err);
    return;
  }
  const error = err.errors[0];
  const contextLines = err.pluginCode?.split('\n');
  const errorLine = error.location.lineText;
  const errorLineInContext = contextLines?.indexOf(errorLine);
  const event_id = randomBytes(16).toString('hex');
  const timestamp = new Date();

  const parsedUrl = new URL(spotlightUrl);
  let spotlightErrorStreamUrl: string = spotlightUrl;
  if (!parsedUrl.pathname.endsWith('/stream')) {
    spotlightErrorStreamUrl = new URL('/stream', spotlightUrl).href;
  }

  const envelope = [
    { event_id, sent_at: timestamp.toISOString() },
    { type: 'event' },
    {
      event_id,
      level: 'error',
      platform: 'javascript',
      environment: 'development',
      tags: { runtime: 'vite' },
      timestamp: timestamp.getTime(),
      exception: {
        values: [
          {
            type: 'Error',
            mechanism: {
              type: 'instrument',
              handled: false,
            },
            value: error.text,
            stacktrace: {
              frames: [
                error
                  ? {
                      filename: error.location.file,
                      lineno: error.location.line,
                      colno: error.location.column,
                      context_line: errorLine,
                      pre_context: contextLines?.slice(0, errorLineInContext),
                      post_context:
                        errorLineInContext != null && errorLineInContext > -1
                          ? contextLines?.slice(errorLineInContext + 1)
                          : undefined,
                    }
                  : {
                      filename: err.id,
                    },
              ],
            },
          },
        ],
      },
    },
  ]
    .map(p => JSON.stringify(p))
    .join('\n');
  return await fetch(spotlightErrorStreamUrl, {
    method: 'POST',
    body: envelope,
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
  });
}

export default function spotlight(options: SpotlightInitOptions = {}): PluginOption {
  let spotlightPath: string;

  return {
    name: 'spotlight',
    apply: 'serve',
    transform(code: string, id: string /*, _opts = {}*/) {
      // Only modify Vite's special client script
      // The magic value below comes from vite/constants:CLIENT_ENTRY
      if (!id.endsWith('vite/dist/client/client.mjs')) return;

      return `${buildClientInit({ ...options, importPath: spotlightPath })}${code}`;
    },
    configureServer(server: ViteDevServer) {
      setupSidecar({ port: options.port });

      spotlightPath = getSpotlightClientModulePath({ server });

      // We gotta use the "Injecting Post Middleware" trick from https://vitejs.dev/guide/api-plugin.html#configureserver
      // because error handlers can only come last per https://expressjs.com/en/guide/error-handling.html#writing-error-handlers
      return () =>
        server.middlewares.use(async function viteErrorToSpotlight(
          err: ErrorPayload['err'],
          _req: Connect.IncomingMessage,
          res: ServerResponse,
          next: Connect.NextFunction,
        ) {
          await sendErrorToSpotlight(err, options.sidecarUrl);

          // The following part is per https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
          if (res.headersSent) {
            return next(err);
          }
        });
    },
  };
}
