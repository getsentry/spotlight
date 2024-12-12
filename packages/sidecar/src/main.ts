import { captureException, getTraceData, startSpan } from '@sentry/node';
import launchEditor from 'launch-editor';
import { createWriteStream, readFileSync } from 'node:fs';
import { createServer, get, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { createGunzip, createInflate } from 'node:zlib';
import { CONTEXT_LINES_ENDPOINT, DEFAULT_PORT, SERVER_IDENTIFIER } from './constants.js';
import { contextLinesHandler } from './contextlines.js';
import { activateLogger, enableDebugLogging, logger, type SidecarLogger } from './logger.js';
import { MessageBuffer } from './messageBuffer.js';

type Payload = [string, string];

type IncomingPayloadCallback = (body: string) => void;

type SideCarOptions = {
  /**
   * The port on which the sidecar should listen.
   * Defaults to 8969.
   */
  port?: string | number;

  /**
   * A logger that implements the SidecarLogger interface.
   * Use this to inject your custom logger implementation.
   *
   * @default - a simple logger logging to the console.
   */
  logger?: SidecarLogger;

  /**
   * The base path from where the static files should be served.
   */
  basePath?: string;

  filesToServe?: Record<string, Buffer>;

  /**
   * More verbose logging.
   */
  debug?: boolean;

  /**
   * A callback that will be called with the incoming message.
   * Helpful for debugging.
   */
  incomingPayload?: IncomingPayloadCallback;
};

type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  pathname?: string,
  searchParams?: URLSearchParams,
) => void;

const withTracing =
  (fn: CallableFunction, spanArgs = {}) =>
  (...args: unknown[]) =>
    startSpan({ name: fn.name, ...spanArgs }, () => fn(...args));

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE,PATCH',
} as const;

const SPOTLIGHT_HEADERS = {
  'X-Powered-by': SERVER_IDENTIFIER,
} as const;

const enableCORS = (handler: RequestHandler): RequestHandler =>
  withTracing(
    (req: IncomingMessage, res: ServerResponse, pathname?: string, searchParams?: URLSearchParams) => {
      const headers = {
        ...CORS_HEADERS,
        ...SPOTLIGHT_HEADERS,
      };
      for (const [header, value] of Object.entries(headers)) {
        res.setHeader(header, value);
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Cache-Control': 'no-cache',
        });
        res.end();
        return;
      }
      return handler(req, res, pathname, searchParams);
    },
    { name: 'enableCORS', op: 'sidecar.http.middleware.cors' },
  );
const streamRequestHandler = (buffer: MessageBuffer<Payload>, incomingPayload?: IncomingPayloadCallback) => {
  return function handleStreamRequest(
    req: IncomingMessage,
    res: ServerResponse,
    pathname?: string,
    searchParams?: URLSearchParams,
  ): void {
    if (
      req.method === 'GET' &&
      req.headers.accept &&
      req.headers.accept === 'text/event-stream' &&
      pathname === '/stream'
    ) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();
      // Send something in the body to trigger the `open` event
      // This is mostly for Firefox -- see #376
      res.write('\n');

      const sub = buffer.subscribe(([payloadType, data]) => {
        logger.debug('🕊️ sending to Spotlight');
        res.write(`event:${payloadType}\n`);
        // This is very important - SSE events are delimited by two newlines
        for (const line of data.split('\n')) {
          res.write(`data:${line}\n`);
        }
        res.write('\n');
      });

      req.on('close', () => {
        buffer.unsubscribe(sub);
        res.end();
      });
    } else if (req.method === 'POST') {
      logger.debug(`📩 Received event`);
      let body = '';
      let stream = req;

      // Check for gzip or deflate encoding and create appropriate stream
      const encoding = req.headers['content-encoding'];
      if (encoding === 'gzip') {
        // @ts-ignore
        stream = req.pipe(createGunzip());
      } else if (encoding === 'deflate') {
        // @ts-ignore
        stream = req.pipe(createInflate());
      }

      // Read the (potentially decompressed) stream
      stream.on('readable', () => {
        let chunk;
        while ((chunk = stream.read()) !== null) {
          body += chunk;
        }
      });

      stream.on('end', () => {
        let contentType = req.headers['content-type']?.split(';')[0].toLocaleLowerCase();
        if (searchParams?.get('sentry_client')?.startsWith('sentry.javascript.browser') && req.headers.origin) {
          // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
          contentType = 'application/x-sentry-envelope';
        }
        if (!contentType) {
          logger.warn('No content type, skipping payload...');
        } else {
          buffer.put([contentType, body]);
        }

        if (process.env.SPOTLIGHT_CAPTURE || incomingPayload) {
          const timestamp = new Date().getTime();
          const filename = `${contentType?.replace(/[^a-z0-9]/gi, '_') || 'no_content_type'}-${timestamp}.txt`;

          if (incomingPayload) {
            incomingPayload(body);
          } else {
            createWriteStream(filename).write(body);
            logger.info(`🗃️ Saved data to ${filename}`);
          }
        }

        // 204 would be more appropriate but returning 200 to match what /envelope returns
        res.writeHead(200, {
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.end();
      });
    } else {
      error405(req, res);
      return;
    }
  };
};

const fileServer = (filesToServe: Record<string, Buffer>) => {
  return function serveFile(req: IncomingMessage, res: ServerResponse, pathname?: string): void {
    let filePath = `${pathname || req.url}`;
    if (filePath === '/') {
      filePath = '/src/index.html';
    }
    filePath = filePath.slice(1);

    const extName = extname(filePath);
    let contentType = 'text/html';
    switch (extName) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    if (!Object.hasOwn(filesToServe, filePath)) {
      error404(req, res);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(filesToServe[filePath]);
    }
  };
};

function handleHealthRequest(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    ...CORS_HEADERS,
    ...SPOTLIGHT_HEADERS,
  });
  res.end('OK');
}

function handleClearRequest(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === 'DELETE') {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
    });
    clearBuffer();
    res.end('Cleared');
  } else {
    error405(req, res);
  }
}

function openRequestHandler(basePath: string = process.cwd()) {
  return (req: IncomingMessage, res: ServerResponse) => {
    // We're only interested in handling a POST request
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
    }

    let requestBody = '';
    req.on('data', chunk => {
      requestBody += chunk;
    });

    req.on('end', () => {
      const targetPath = resolve(basePath, requestBody);
      logger.debug(`Launching editor for ${targetPath}`);
      launchEditor(
        // filename:line:column
        // both line and column are optional
        targetPath,
        // callback if failed to launch (optional)
        (fileName: string, errorMsg: string) => {
          logger.error(`Failed to launch editor for ${fileName}: ${errorMsg}`);
        },
      );
      res.writeHead(204);
      res.end();
    });
  };
}

function errorResponse(code: number) {
  return withTracing(
    (_req: IncomingMessage, res: ServerResponse) => {
      res.writeHead(code);
      res.end();
    },
    { name: `HTTP ${code}`, op: `sidecar.http.error.${code}`, attributes: { 'http.response.status_code': code } },
  );
}

const error404 = errorResponse(404);
const error405 = errorResponse(405);

function startServer(
  buffer: MessageBuffer<Payload>,
  port: number,
  basePath?: string,
  filesToServe?: Record<string, Buffer>,
  incomingPayload?: IncomingPayloadCallback,
): Server {
  if (basePath && !filesToServe) {
    filesToServe = {
      '/src/index.html': readFileSync(join(basePath, 'src/index.html')),
      '/assets/main.js': readFileSync(join(basePath, 'assets/main.js')),
    };
  }
  const ROUTES: [RegExp, RequestHandler][] = [
    [/^\/health$/, handleHealthRequest],
    [/^\/clear$/, enableCORS(handleClearRequest)],
    [/^\/stream$|^\/api\/\d+\/envelope\/?$/, enableCORS(streamRequestHandler(buffer, incomingPayload))],
    [/^\/open$/, enableCORS(openRequestHandler(basePath))],
    [RegExp(`^${CONTEXT_LINES_ENDPOINT}$`), enableCORS(contextLinesHandler)],
    [/^.+$/, filesToServe != null ? enableCORS(fileServer(filesToServe)) : error404],
  ];

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url;
    if (!url) {
      return error404(req, res);
    }

    const host = req.headers.host || 'localhost';
    const { pathname, searchParams } = new URL(url, `http://${host}`);
    const route = ROUTES.find(route => route[0].test(pathname));
    if (!route) {
      return error404(req, res);
    }
    return startSpan(
      {
        name: `HTTP ${req.method} ${pathname}`,
        op: `sidecar.http.${req.method?.toLowerCase()}`,
        forceTransaction: true,
        attributes: {
          'http.request.method': req.method,
          'http.request.url': url,
          'http.request.query': searchParams.toString(),
          'server.address': host,
          'server.port': req.socket.localPort,
        },
      },
      span => {
        const traceData = getTraceData();
        res.appendHeader(
          'server-timing',
          [
            `sentryTrace;desc="${traceData['sentry-trace']}"`,
            `baggage;desc="${traceData.baggage}"`,
            `sentrySpotlightPort;desc=${port}`,
          ].join(', '),
        );
        const result = route[1](req, res, pathname, searchParams);
        span.setAttribute('http.response.status_code', res.statusCode);
        return result;
      },
    );
  });

  server.on('error', handleServerError);

  server.listen(port, () => {
    handleServerListen(port, basePath);
  });

  return server;

  function handleServerError(e: { code?: string }): void {
    if ('code' in e && e.code === 'EADDRINUSE') {
      logger.info(`Port ${port} in use, retrying...`);
      setTimeout(() => {
        server.close();
        server.listen(port);
        logger.info(`Port ${port} in use, retrying...`);
      }, 5000);
    } else {
      captureException(e);
    }
  }

  function handleServerListen(port: number, basePath?: string): void {
    logger.info(`Sidecar listening on ${port}`);
    if (basePath) {
      logger.info(`You can open: http://localhost:${port} to see the Spotlight overlay directly`);
    }
  }
}

let serverInstance: Server;
const buffer: MessageBuffer<Payload> = new MessageBuffer<Payload>();

const isValidPort = withTracing(
  (value: string | number) => {
    if (typeof value === 'string') {
      const portNumber = Number(value);
      return /^\d+$/.test(value) && portNumber > 0 && portNumber <= 65535;
    }
    return value > 0 && value <= 65535;
  },
  { name: 'isValidPort', op: 'sidecar.server.portCheck' },
);

const isSidecarRunning = withTracing(
  (port: string | number | undefined) => {
    return new Promise(resolve => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 2000,
        headers: { Connection: 'close' },
      };

      const healthReq = get(options, res => {
        const serverIdentifier = res.headers['x-powered-by'];
        if (serverIdentifier === 'spotlight-by-sentry') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      healthReq.on('error', () => {
        resolve(false);
      });
      healthReq.end();
    });
  },
  { name: 'isSidecarRunning', op: 'sidecar.server.collideCheck' },
);

export function setupSidecar({
  port,
  logger: customLogger,
  basePath,
  filesToServe,
  debug,
  incomingPayload,
}: SideCarOptions = {}): void {
  let sidecarPort = DEFAULT_PORT;

  if (customLogger) {
    activateLogger(customLogger);
  }

  if (debug || process.env.SPOTLIGHT_DEBUG) {
    enableDebugLogging(true);
  }

  if (port && !isValidPort(port)) {
    logger.info('Please provide a valid port.');
    process.exit(1);
  } else if (port) {
    sidecarPort = typeof port === 'string' ? Number(port) : port;
  }

  isSidecarRunning(sidecarPort).then((isRunning: boolean) => {
    if (isRunning) {
      logger.info(`Sidecar is already running on port ${sidecarPort}`);
    } else if (!serverInstance) {
      serverInstance = startServer(buffer, sidecarPort, basePath, filesToServe, incomingPayload);
    }
  });
}

export function clearBuffer(): void {
  buffer.clear();
}

let forceShutdown = false;
export const shutdown = () => {
  if (forceShutdown || !serverInstance) {
    logger.info('Bye.');
    process.exit(0);
  }
  if (serverInstance) {
    forceShutdown = true;
    logger.info('Shutting down server gracefully...');
    serverInstance.close();
    serverInstance.closeAllConnections();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
