import { IncomingMessage, Server, ServerResponse, createServer } from 'http';
import { bold, magenta } from 'kleur';

const defaultResponse = `<!doctype html>
<html>
<head>
        <title>pipe</title>
</head>
<body>
        <pre id="output"></pre>
        <script type="text/javascript">
const Output = document.getElementById("output");
var EvtSource = new EventSource('/stream');
EvtSource.onmessage = function (event) {
        Output.appendChild(document.createTextNode(event.data));
        Output.appendChild(document.createElement("br"));
};
        </script>
</body>
</html>`;

function generateUuidv4(): string {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let rnd = Math.random() * 16;
    rnd = (dt + rnd) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? rnd : (rnd & 0x3) | 0x8).toString(16);
  });
}

class MessageBuffer<T> {
  private size: number;
  private items: [number, T][];
  private writePos = 0;
  private head = 0;
  private timeout = 10;
  private readers = new Map<string, (item: T) => void>();

  constructor(size = 100) {
    this.size = size;
    this.items = new Array(size);
  }

  put(item: T): void {
    const curTime = new Date().getTime();
    this.items[this.writePos % this.size] = [curTime, item];
    this.writePos += 1;
    if (this.head === this.writePos) {
      this.head += 1;
    }

    const minTime = curTime - this.timeout * 1000;
    let atItem;
    while (this.head < this.writePos) {
      atItem = this.items[this.head % this.size];
      if (atItem === undefined) break;
      if (atItem[0] > minTime) break;
      this.head += 1;
    }
  }

  subscribe(callback: (item: T) => void): string {
    const readerId = generateUuidv4();
    this.readers.set(readerId, callback);
    setTimeout(() => this.stream(readerId));
    return readerId;
  }

  unsubscribe(readerId: string): void {
    this.readers.delete(readerId);
  }

  stream(readerId: string, readPos = this.head): void {
    const cb = this.readers.get(readerId);
    if (!cb) return;

    let atReadPos = readPos;
    let item;
    /* eslint-disable no-constant-condition */
    while (true) {
      item = this.items[atReadPos % this.size];
      if (typeof item === 'undefined') {
        break;
      }
      cb(item[1]);
      atReadPos += 1;
    }
    setTimeout(() => this.stream(readerId, atReadPos), 500);
  }
}

type Payload = [string, string];

function getCorsHeader(): { [name: string]: string } {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
  };
}

function handleStreamRequest(req: IncomingMessage, res: ServerResponse, buffer: MessageBuffer<Payload>): void {
  log(`Received request ${req.method} ${req.url}`);
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
        res.write(`event:${payloadType}\n`);
        data.split('\n').forEach(line => {
          res.write(`data:${line}\n`);
        });
        res.write('\n');
      });

      req.on('close', () => {
        buffer.unsubscribe(sub);
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
        let body: string = '';
        req.on('readable', () => {
          const chunk = req.read();
          if (chunk !== null) body += chunk;
        });
        req.on('end', () => {
          buffer.put([`${req.headers['content-type']}`, body]);
          res.writeHead(204, {
            'Cache-Control': 'no-cache',
            ...getCorsHeader(),
            Connection: 'keep-alive',
          });
          res.end();
        });
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/html',
        });
        res.write(defaultResponse);
        res.end();
      }
    } else {
      res.writeHead(404);
      res.end();
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
    log(`Sidecar listening on ${port}`);
  });

  return server;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
  console.log(bold(magenta('🔦 [Spotlight]')), ...args);
}

let serverInstance: Server;

export function setupSidecar(): void {
  const buffer: MessageBuffer<Payload> = new MessageBuffer<Payload>();

  if (!serverInstance) {
    serverInstance = startServer(buffer, 8969);
  }
}

function shutdown() {
  if (serverInstance) {
    log('Shutting down server');
    serverInstance.close();
  }
}

process.on('SIGTERM', () => {
  shutdown();
});
