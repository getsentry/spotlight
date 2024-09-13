import { trigger } from '../../lib/eventTarget';
import type { WindowWithSpotlight } from '../../types';
import type { Integration } from '../integration';
import ConsoleTab from './console-tab';
import type { ConsoleMessage, Level } from './types';

const CONTENT_TYPE = 'application/x-spotlight-console';

/**
 * This integration is meant to run on the same page where
 * the Spotlight UI is running. For standalone UI cases such
 * as the Electron app, we should publish a separate version
 * that takes in the sidecar URL.
 * @returns Integration Console integration for Spotlight
 */
export default function consoleIntegration() {
  const pageloadId = window.crypto.randomUUID();

  return {
    name: 'console',
    forwardedContentType: [CONTENT_TYPE],
    tabs: ({ processedEvents }) => [
      {
        id: 'console',
        title: 'Browser Console Logs',
        notificationCount: { count: processedEvents.length },
        content: ConsoleTab,
      },
    ],

    setup: () => {
      instrumentConsole('log', pageloadId);
      instrumentConsole('warn', pageloadId);
      instrumentConsole('error', pageloadId);
    },

    processEvent({ data }) {
      const msgJson = JSON.parse(data.toString()) as ConsoleMessage;

      return {
        event: msgJson,
      };
    },
  } satisfies Integration;
}

function instrumentConsole(level: Level, pageloadId: string) {
  const windowWithSpotlight = window as WindowWithSpotlight;
  if (!windowWithSpotlight.__spotlight) {
    windowWithSpotlight.__spotlight = {};
  }
  if (!windowWithSpotlight.__spotlight.console) {
    windowWithSpotlight.__spotlight.console = {};
  }
  const originalConsole = windowWithSpotlight.__spotlight.console;
  if (!originalConsole[level]) {
    originalConsole[level] = window.console[level];
  }
  const originalConsoleMethod = originalConsole[level];

  window.console[level] = (...args: unknown[]) => {
    const serializedArgs = argsToString(args);

    trigger('event', {
      contentType: CONTENT_TYPE,
      data: JSON.stringify({
        type: level,
        args: serializedArgs,
        msg: serializedArgs.join(' '),
        sessionId: pageloadId,
      } satisfies ConsoleMessage),
    });

    return originalConsoleMethod.call(window, ...args);
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
