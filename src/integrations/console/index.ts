import type { Integration } from '../integration';
import ConsoleTab from './console-tab';
import { ConsoleMessage, Levels } from './types';

const HEADER = 'application/x-spotlight-console';
const PORT = 8969;

export default function consoleIntegration() {
  const pageloadId = window.crypto.randomUUID();

  return {
    name: 'console',
    forwardedContentType: [HEADER],
    tabs: [
      {
        id: 'console',
        title: 'Browser Console Logs',
        content: ConsoleTab,
      },
    ],

    setup: () => {
      instrumentConsole('log', pageloadId);
      instrumentConsole('warn', pageloadId);
    },

    processEvent({ data, contentType }) {
      const msgJson = JSON.parse(data) as ConsoleMessage;
      // if (msgJson.sessionId !== pageloadId) {
      //   return undefined;
      // }

      console.log(`[Spotlight] event ${msgJson} (type ${contentType})`);
      return msgJson;
    },
  } satisfies Integration;
}

function instrumentConsole(level: Levels, pageloadId: string) {
  const originalConsoleLog = window.console[level];

  window.console[level] = (...args: unknown[]) => {
    const serializedArgs = argsToString(args);
    // Super dumb way to avoid endless loops (we're gonna regret that)
    if (serializedArgs.find(a => a.toLowerCase().includes('spotlight'))) {
      return originalConsoleLog(...args);
    }

    void fetch(`http://localhost:${PORT}/stream`, {
      method: 'POST',
      body: JSON.stringify({
        type: level,
        args: serializedArgs,
        msg: serializedArgs.join(' '),
        sessionId: pageloadId,
      } satisfies ConsoleMessage),
      headers: {
        'Content-Type': HEADER,
      },
      mode: 'cors',
    });

    console.log('[Spotlight] Sent Console Event');

    return originalConsoleLog(...args);
  };
}

function argsToString(args: unknown[]): string[] {
  return args.map(arg => {
    if (arg === null) {
      return 'null';
    }
    if (arg === undefined) {
      return 'undefined';
    }
    if (typeof arg === 'string') {
      return arg;
    }
    return safeToString(arg);
  });
}

function safeToString(arg: { toString: () => string }): string {
  try {
    return JSON.stringify(arg);
  } catch {
    return '[serialization error]';
  }
}
