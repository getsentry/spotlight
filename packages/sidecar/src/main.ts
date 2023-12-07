import { createWriteStream, readFile } from 'fs';
import { IncomingMessage, Server, ServerResponse, createServer } from 'http';
import { join, resolve } from 'path';
import { createGunzip, createInflate } from 'zlib';
import { SidecarLogger, activateLogger, logger } from './logger.js';
import { MessageBuffer } from './messageBuffer.js';

const DEFAULT_PORT = 8969;

type Payload = [string, string];

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
};

function getCorsHeader(): { [name: string]: string } {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
  };
}

function handleStreamRequest(req: IncomingMessage, res: ServerResponse, buffer: MessageBuffer<Payload>): void {
  if (req.headers.accept && req.headers.accept == 'text/event-stream') {
    if (req.url == '/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...getCorsHeader(),
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
  } else {
    if (req.url == '/stream') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Cache-Control': 'no-cache',
          ...getCorsHeader(),
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

          if (process.env.SPOTLIGHT_CAPTURE) {
            const timestamp = new Date().getTime();
            const contentType = `${req.headers['content-type']}`;
            const filename = `${contentType.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${timestamp}.txt`;

            createWriteStream(filename).write(body);
            logger.info(`🗃️ Saved data to ${filename}`);
          }

          res.writeHead(204, {
            'Cache-Control': 'no-cache',
            ...getCorsHeader(),
            Connection: 'keep-alive',
          });
          res.end();
        });
      }
    } else {
      readFile(join(resolve(), 'src', 'overlay.html'), (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end(`Something went wrong: ${err.code}`);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
    }
  }
}

function startServer(buffer: MessageBuffer<Payload>, port: number): Server {
  const server = createServer((req, res) => {
    handleStreamRequest(req, res, buffer);
  });

  server.on('error', e => {
    if ('code' in e && e.code === 'EADDRINUSE') {
      setTimeout(() => {
        server.close();
        server.listen(port);
      }, 5000);
    }
  });
  server.listen(port, () => {
    logger.info(`Sidecar listening on ${port}`);
    logger.info(`You can open: http://localhost:${port} to see the Spotlight overlay directly`);
  });

  return server;
}

let serverInstance: Server;

const isValidPort = (value: string | number) => {
  if (typeof value === 'string') {
    const portNumber = parseInt(value, 10);
    return /^\d+$/.test(value) && portNumber > 0 && portNumber <= 65535;
  }
  return value > 0 && value <= 65535;
};

export function setupSidecar({ port, logger: customLogger }: SideCarOptions = {}): void {
  let sidecarPort = DEFAULT_PORT;

  if (customLogger) {
    activateLogger(customLogger);
  }

  if (port && !isValidPort(port)) {
    logger.info('Please provide a valid port.');
    process.exit(1);
  } else if (port) {
    sidecarPort = typeof port === 'string' ? parseInt(port, 10) : port;
  }

  const buffer: MessageBuffer<Payload> = new MessageBuffer<Payload>();

  if (!serverInstance) {
    serverInstance = startServer(buffer, sidecarPort);
  }
}

function shutdown() {
  if (serverInstance) {
    logger.info('Shutting down Server');
    serverInstance.close();
  }
}

process.on('SIGTERM', () => {
  shutdown();
});
