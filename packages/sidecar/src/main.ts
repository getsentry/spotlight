import { createWriteStream, readFile } from 'fs';
import { IncomingMessage, Server, ServerResponse, createServer, get } from 'http';
import { extname, join } from 'path';
import { createGunzip, createInflate } from 'zlib';
import { SidecarLogger, activateLogger, enableDebugLogging, logger } from './logger.js';
import { MessageBuffer } from './messageBuffer.js';

const DEFAULT_PORT = 8969;
const SERVER_IDENTIFIER = 'spotlight-by-sentry';

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

function getCorsHeader(): { [name: string]: string } {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS,DELETE,PATCH',
  };
}

function getSpotlightHeader() {
  return {
    'X-Powered-by': SERVER_IDENTIFIER,
  };
}
/**
 * Returns true of the request was handled, false otherwise.
 */
function handleStreamRequest(
  req: IncomingMessage,
  res: ServerResponse,
  buffer: MessageBuffer<Payload>,
  incomingPayload?: IncomingPayloadCallback,
): boolean {
  if (req.headers.accept && req.headers.accept == 'text/event-stream') {
    if (req.url == '/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...getCorsHeader(),
        ...getSpotlightHeader(),
        Connection: 'keep-alive',
      });
      res.flushHeaders();

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
    } else {
      res.writeHead(404);
      res.end();
    }
    return true;
  } else {
    if (req.url == '/stream') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Cache-Control': 'no-cache',
          ...getCorsHeader(),
          ...getSpotlightHeader(),
        });
        res.end();
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
            ...getCorsHeader(),
            ...getSpotlightHeader(),
            Connection: 'keep-alive',
          });
          res.end();
        });
      }
      return true;
    }
  }
  return false;
}
function serveFile(req: IncomingMessage, res: ServerResponse, basePath: string): void {
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
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

function startServer(
  buffer: MessageBuffer<Payload>,
  port: number,
  basePath?: string,
  incomingPayload?: IncomingPayloadCallback,
): Server {
  const server = createServer(handleRequest);

  server.on('error', handleServerError);

  server.listen(port, () => {
    handleServerListen(port, basePath);
  });

  return server;

  function handleRequest(req: IncomingMessage, res: ServerResponse): void {
    if (req.url === '/health') {
      handleHealthRequest(res);
    } else if (req.url === '/clear') {
      handleClearRequest(req, res);
    } else {
      handleOtherRequest(req, res);
    }
  }

  function handleHealthRequest(res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      ...getCorsHeader(),
      ...getSpotlightHeader(),
    });
    res.end('OK');
  }

  function handleClearRequest(req: IncomingMessage, res: ServerResponse): void {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Cache-Control': 'no-cache',
        ...getCorsHeader(),
        ...getSpotlightHeader(),
      });
      res.end();
    } else if (req.method === 'DELETE') {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        ...getCorsHeader(),
        ...getSpotlightHeader(),
      });
      clearBuffer();
      res.end('Cleared');
    }
  }

  function handleOtherRequest(req: IncomingMessage, res: ServerResponse): void {
    const handled = handleStreamRequest(req, res, buffer, incomingPayload);

    if (!handled && basePath) {
      serveFile(req, res, basePath);
    }

    if (!handled && !basePath) {
      res.writeHead(404);
      res.end();
    }
  }

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
