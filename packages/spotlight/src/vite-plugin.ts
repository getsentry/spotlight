import * as Sentry from '@sentry/node';
import type { ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Connect, ErrorPayload, ViteDevServer } from 'vite';
import { setupSidecar } from './sidecar';

const FILE_PROTOCOL_PREFIX_LENGTH = 'file://'.length;

export default function spotlight({ port }: { port?: number } = {}) {
  Sentry.init({
    tracesSampleRate: 0,
    spotlight: true,
  });

  return {
    name: 'spotlight',
    configureServer(server: ViteDevServer) {
      setupSidecar({ port });

      const spotlightPath = resolve(
        server.config.root,
        // @ts-expect-error
        import.meta.resolve('@spotlightjs/spotlight').slice(FILE_PROTOCOL_PREFIX_LENGTH),
      ).split('?', 1)[0];
      server.config.server.fs.allow.push(spotlightPath);
      console.log(spotlightPath);

      server.middlewares.use((req, res, next) => {
        // The magic value below comes from vite/constants:CLIENT_PUBLIC_PATH
        if (req.url === '/@vite/client') {
          const _end = res.end;
          // @ts-expect-error
          res.end = function (data, encoding, callback) {
            data += [
              'createErrorOverlay=() => {};',
              `import * as Spotlight from '/@fs${spotlightPath}';`,
              'Spotlight.init({injectImmediately: true, integrations: [Spotlight.sentry({openLastError: true})]});',
            ].join('\n');
            _end.call(res, data, encoding, callback);
          };
        }
        next();
      });

      // We gotta use the "Injecting Post Middleware" trick from https://vitejs.dev/guide/api-plugin.html#configureserver
      // because error handlers can only come last per https://expressjs.com/en/guide/error-handling.html#writing-error-handlers
      return () =>
        server.middlewares.use(
          (
            err: ErrorPayload['err'],
            _req: Connect.IncomingMessage,
            res: ServerResponse,
            next: Connect.NextFunction,
          ) => {
            // The code below is lifted from
            // https://github.com/vitejs/vite/blob/22b299429599834bf1855b53264a28ae5ff8f888/packages/vite/src/client/overlay.ts#L218C5-L237C6
            let title = err.plugin ? `[plugin:${err.plugin}] ` : '';
            const [file] = (err.loc?.file || err.id || 'unknown file').split(`?`);
            if (err.loc) {
              title += `${file}:${err.loc.line}:${err.loc.column}`;
            } else if (err.id) {
              title += file;
            }

            Sentry.addBreadcrumb({
              category: 'file',
              message:
                title +
                '\n' +
                // Remove all ANSI escapes -- thanks to https://stackoverflow.com/a/29497680/90297
                // eslint-disable-next-line no-control-regex
                err.frame?.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''),
              level: 'error',
            });

            Sentry.captureException(err);

            // The following part is per https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
            if (res.headersSent) {
              return next(err);
            }
          },
        );
    },
  };
}
