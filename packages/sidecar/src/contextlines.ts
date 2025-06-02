import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { LEAST_UPPER_BOUND, TraceMap, originalPositionFor, sourceContentFor } from '@jridgewell/trace-mapping';

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

function applySourceContextToFrame(sourceMapContent: string, frame: ValidSentryStackFrame) {
  const tracer = new TraceMap(JSON.parse(sourceMapContent));

  const originalPosition = originalPositionFor(tracer, {
    line: frame.lineno,
    column: frame.colno,
    bias: LEAST_UPPER_BOUND,
  });

  if (originalPosition.source && originalPosition.line && originalPosition.column) {
    frame.lineno = originalPosition.line;
    frame.colno = originalPosition.column;
    const filePath = new URL(frame.filename).pathname.slice(1); // slice(1) is to not make it absolute path
    frame.filename = path.resolve(path.join(path.dirname(filePath), originalPosition.source));

    const content = sourceContentFor(tracer, originalPosition.source);
    const lines = content?.split(os.EOL) ?? [];
    addContextLinesToFrame(lines, frame);
  }

  return originalPosition;
}

function addContextLinesToFrame(lines: string[], frame: ValidSentryStackFrame, linesOfContext = 5): void {
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

export function contextLinesHandler(req: IncomingMessage, res: ServerResponse) {
  // We're only interested in handling a PUT request
  if (req.method !== 'PUT') {
    res.writeHead(405);
    res.end();
    return;
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
        !isValidSentryStackFrame(frame) ||
        // let's ignore dependencies for now with this naive check
        frame.filename.includes('/node_modules/')
      ) {
        continue;
      }
      const { filename } = frame;
      // Dirty check to see if this looks like a regular file path or a URL
      if (filename.includes('://')) {
        const generatedCode = await getGeneratedCodeFromServer(frame.filename);
        if (!generatedCode) {
          continue;
        }

        // Extract the inline source map from the minified code
        const inlineSourceMapMatch = generatedCode.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.*)/);

        if (inlineSourceMapMatch?.[1]) {
          const sourceMapBase64 = inlineSourceMapMatch[1];
          const sourceMapContent = Buffer.from(sourceMapBase64, 'base64').toString('utf-8');
          applySourceContextToFrame(sourceMapContent, frame);
        }
      } else if (!filename.includes(':')) {
        try {
          const lines = readFileSync(filename, { encoding: 'utf-8' }).split(/\r?\n/);
          addContextLinesToFrame(lines, frame);
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw err;
          }
        }
      }
    }

    const responseJson = JSON.stringify(stacktrace);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(responseJson);
  });
}
