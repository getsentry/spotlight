import type { ServerResponse } from 'node:http';

import * as Sentry from '@sentry/node';
// Cannot use import.meta.resolve -- @see https://github.com/vitejs/vite/discussions/15871
import { resolve } from 'import-meta-resolve';
import * as os from 'node:os';
import * as SourceMap from 'source-map';
import type { Connect, ErrorPayload, Plugin, ViteDevServer } from 'vite';
import { setupSidecar } from './sidecar';

type SourceContext = {
  pre_context?: string[];
  context_line?: string;
  post_context?: string[];
};

type SentryStackFrame = {
  filename?: string;
  lineno?: number;
  colno?: number;
} & SourceContext;

type ValidSentryStackFrame = Required<SentryStackFrame>;

type SentryStackTrace = {
  frames?: SentryStackFrame[];
};

const FILE_PROTOCOL_PREFIX_LENGTH = 'file://'.length;

export function getClientModulePath(module: string, server?: ViteDevServer): string {
  const modulePath = resolve(module, import.meta.url)
    .slice(FILE_PROTOCOL_PREFIX_LENGTH)
    .split('?', 1)[0];
  if (server) {
    server.config.server.fs.allow.push(modulePath);
  }

  return modulePath;
}

async function getGeneratedCodeFromServer(filename: string): Promise<string | undefined> {
  try {
    const generatedCodeResponse = await fetch(filename);
    return generatedCodeResponse.text();
  } catch {
    return undefined;
  }
}

function parseStackTrace(requestBody: string): SentryStackTrace | undefined {
  try {
    return JSON.parse(requestBody) as SentryStackTrace;
  } catch {
    return undefined;
  }
}

async function applySourceContextToFrame(sourceMapContent: string, frame: ValidSentryStackFrame) {
  const consumer = await new SourceMap.SourceMapConsumer(sourceMapContent);

  const originalPosition = consumer.originalPositionFor({
    line: frame.lineno,
    column: frame.colno,
    bias: SourceMap.SourceMapConsumer.LEAST_UPPER_BOUND,
  });

  if (originalPosition.source && originalPosition.line && originalPosition.column) {
    frame.lineno = originalPosition.line;
    frame.colno = originalPosition.column;
    const content = consumer.sourceContentFor(originalPosition.source);
    const lines = content?.split(os.EOL) ?? [];
    addContextLinesToFrame(lines, frame);
  }

  return originalPosition;
}

function addContextLinesToFrame(lines: string[], frame: ValidSentryStackFrame, linesOfContext: number = 5): void {
  const maxLines = lines.length;
  const sourceLine = Math.max(Math.min(maxLines - 1, frame.lineno - 1), 0);

  frame.pre_context = lines
    .slice(Math.max(0, sourceLine - linesOfContext), sourceLine)
    .map((line: string) => snipLine(line, 0));

  frame.context_line = snipLine(lines[Math.min(maxLines - 1, sourceLine)], frame.colno || 0);

  frame.post_context = lines
    .slice(Math.min(sourceLine + 1, maxLines), sourceLine + 1 + linesOfContext)
    .map((line: string) => snipLine(line, 0));
}

/**
 * This is basically just `trim_line` from
 * https://github.com/getsentry/sentry/blob/master/src/sentry/lang/javascript/processor.py#L67
 *
 * @param str An object that contains serializable values
 * @param max Maximum number of characters in truncated string
 * @returns string Encoded
 */
function snipLine(line: string, colno: number): string {
  let newLine = line;
  const lineLength = newLine.length;
  if (lineLength <= 150) {
    return newLine;
  }
  if (colno > lineLength) {
    // eslint-disable-next-line no-param-reassign
    colno = lineLength;
  }

  let start = Math.max(colno - 60, 0);
  if (start < 5) {
    start = 0;
  }

  let end = Math.min(start + 140, lineLength);
  if (end > lineLength - 5) {
    end = lineLength;
  }
  if (end === lineLength) {
    start = Math.max(end - 140, 0);
  }

  newLine = newLine.slice(start, end);
  if (start > 0) {
    newLine = `'{snip} ${newLine}`;
  }
  if (end < lineLength) {
    newLine += ' {snip}';
  }

  return newLine;
}

function isValidSentryStackFrame(frame: SentryStackFrame): frame is ValidSentryStackFrame {
  return !!frame.filename && !!frame.lineno && !!frame.colno;
}

export const CONTEXT_LINES_ENDPOINT = '/spotlight/contextlines';
export const sourceContextMiddleware: Connect.NextHandleFunction = function (req, res, next) {
  // We're only interested in handling a PUT request to CONTEXT_LINES_ENDPOINT
  if (req.url !== CONTEXT_LINES_ENDPOINT || req.method !== 'PUT') {
    return next();
  }

  let requestBody = '';
  req.on('data', chunk => {
    requestBody += chunk;
  });

  req.on('end', async () => {
    const stacktrace = parseStackTrace(requestBody);

    if (!stacktrace) {
      res.writeHead(500);
      res.end();
      return;
    }

    for (const frame of stacktrace.frames ?? []) {
      if (
        isValidSentryStackFrame(frame) &&
        // let's ignore dependencies for now with this naive check
        !frame.filename.includes('/node_modules/')
      ) {
        const generatedCode = await getGeneratedCodeFromServer(frame.filename);
        if (!generatedCode) {
          continue;
        }

        // Extract the inline source map from the minified code
        const inlineSourceMapMatch = generatedCode.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.*)/);

        if (inlineSourceMapMatch && inlineSourceMapMatch[1]) {
          const sourceMapBase64 = inlineSourceMapMatch[1];
          const sourceMapContent = Buffer.from(sourceMapBase64, 'base64').toString('utf-8');
          await applySourceContextToFrame(sourceMapContent, frame);
        }
      }
    }

    const responseJson = JSON.stringify(stacktrace);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(responseJson);
  });
};

export default function spotlight({ port }: { port?: number } = {}): Plugin {
  Sentry.init({
    tracesSampleRate: 0,
    spotlight: true,
  });

  let spotlightPath: string;

  return {
    name: 'spotlight',
    apply: 'serve',
    transform(code: string, id: string /*, _opts = {}*/) {
      // Only modify Vite's special client script
      // The magic value below comes from vite/constants:CLIENT_ENTRY
      if (!id.endsWith('vite/dist/client/client.mjs')) return;

      const initSnippet = [
        'createErrorOverlay=()=>{}',
        `import * as Spotlight from '/@fs${spotlightPath}'`,
        'Spotlight.init({injectImmediately: true, integrations: [Spotlight.sentry({openLastError: enableOverlay})]})',
      ].join(';\n');

      return `${code}\n${initSnippet}\n`;
    },
    configureServer(server: ViteDevServer) {
      setupSidecar({ port });

      server.middlewares.use(sourceContextMiddleware);

      spotlightPath = getClientModulePath('@spotlightjs/spotlight', server);

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
            const [file] = (err.loc?.file || err.id || 'unknown file').split(`?`);
            let errorLine = '';
            if (err.loc) {
              errorLine = `${file}:${err.loc.line}:${err.loc.column}`;
            } else if (err.id) {
              errorLine = file;
            }

            if (errorLine) {
              // If we have an error line available, add it to the top of the stack trace
              // which will trigger Spotlight to fetch its lines through sourceContextMiddleware
              // above. This obsoletes Vite's stylized source code visualization and makes the
              // problematic part appear at the top of the stack trace natively.
              const stackLines = err.stack.split('\n');
              stackLines.splice(1, 0, `at ${errorLine}`);
              err.stack = stackLines.join('\n');
            }
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
