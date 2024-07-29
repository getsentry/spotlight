import launchEditor from 'launch-editor';
import { createWriteStream, readFile } from 'node:fs';
import { IncomingMessage, Server, ServerResponse, createServer, get } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { createGunzip, createInflate } from 'node:zlib';
import { CONTEXT_LINES_ENDPOINT, DEFAULT_PORT, SERVER_IDENTIFIER } from './constants.js';
import { contextLinesHandler } from './contextlines.js';
import { SidecarLogger, activateLogger, enableDebugLogging, logger } from './logger.js';
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

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

function getCorsHeader(): { [name: string]: string } {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE,PATCH',
  };
}

function enableCORS(handler: RequestHandler): RequestHandler {
  return function corsMiddleware(req: IncomingMessage, res: ServerResponse) {
    const headers = {
      ...getCorsHeader(),
      ...getSpotlightHeader(),
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
    return handler(req, res);
  };
}

function getSpotlightHeader() {
  return {
    'X-Powered-by': SERVER_IDENTIFIER,
  };
}

function streamRequestHandler(buffer: MessageBuffer<Payload>, incomingPayload?: IncomingPayloadCallback) {
  return function handleStreamRequest(req: IncomingMessage, res: ServerResponse): void {
    if (req.method === 'GET' && req.headers.accept && req.headers.accept == 'text/event-stream') {
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
        logger.debug(`🕊️ sending to Spotlight`);
        res.write(`event:${payloadType}\n`);
        // This is very important - SSE events are delimited by two newlines
        data.split('\n').forEach(line => {
          res.write(`data:${line}\n`);
        });
        res.write('\n');
      });

      req.on('close', () => {
        buffer.unsubscribe(sub);
        res.end();
      });
    } else if (req.method === 'POST') {
      logger.debug(`📩 Received event`);
      let body: string = '';
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
        buffer.put([`${req.headers['content-type']}`, body]);

        if (process.env.SPOTLIGHT_CAPTURE || incomingPayload) {
          const timestamp = new Date().getTime();
          const contentType = `${req.headers['content-type']}`;
          const filename = `${contentType.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${timestamp}.txt`;

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
      return error405(req, res);
    }
  };
}
function fileServer(basePath: string) {
  return function serveFile(req: IncomingMessage, res: ServerResponse): void {
    let filePath = '.' + req.url;
    if (filePath == './') {
      filePath = './src/index.html';
    }

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

    readFile(join(basePath, filePath), function (error, content) {
      if (error) {
        return error404(req, res);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  };
}

function handleHealthRequest(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    ...getCorsHeader(),
    ...getSpotlightHeader(),
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
  return function (req: IncomingMessage, res: ServerResponse) {
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
  return (_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(code);
    res.end();
  };
}

const error404 = errorResponse(404);
const error405 = errorResponse(405);

function startServer(
  buffer: MessageBuffer<Payload>,
  port: number,
  basePath?: string,
  incomingPayload?: IncomingPayloadCallback,
): Server {
  const ROUTES: [RegExp, RequestHandler][] = [
    [/^\/health$/, handleHealthRequest],
    [/^\/clear$/, enableCORS(handleClearRequest)],
    [/^\/stream$|^\/api\/\d+\/envelope$/, enableCORS(streamRequestHandler(buffer, incomingPayload))],
    [/^\/open$/, enableCORS(openRequestHandler(basePath))],
    [RegExp(`^${CONTEXT_LINES_ENDPOINT}$`), enableCORS(contextLinesHandler)],
    [/^.+$/, basePath != null ? fileServer(basePath) : error404],
  ];

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url;
    if (!url) {
      return error404(req, res);
    }

    const route = ROUTES.find(route => route[0].test(url));
    if (!route) {
      return error404(req, res);
    }
    return route[1](req, res);
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

const isValidPort = (value: string | number) => {
  if (typeof value === 'string') {
    const portNumber = Number(value);
    return /^\d+$/.test(value) && portNumber > 0 && portNumber <= 65535;
  }
  return value > 0 && value <= 65535;
};

function isSidecarRunning(port: string | number | undefined) {
  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 5000,
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
  });
}

export function setupSidecar({
  port,
  logger: customLogger,
  basePath,
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
  isSidecarRunning(sidecarPort).then(isRunning => {
    if (isRunning) {
      logger.info(`Sidecar is already running on port ${sidecarPort}`);
    } else {
      if (!serverInstance) {
        serverInstance = startServer(buffer, sidecarPort, basePath, incomingPayload);
      }
    }
  });
}

export function clearBuffer(): void {
  buffer.clear();
}

export function shutdown() {
  if (serverInstance) {
    logger.info('Shutting down Server');
    serverInstance.close();
  }
}

process.on('SIGTERM', () => {
  shutdown();
});
