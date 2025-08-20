export const SPOTLIGHT_PREFIX = "🔎 [Spotlight]";

export interface BaseLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const noopLogger: BaseLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const defaultLogger: BaseLogger = {
  info: (...args: unknown[]) => console.log(SPOTLIGHT_PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(SPOTLIGHT_PREFIX, ...args),
  error: (...args: unknown[]) => console.error(SPOTLIGHT_PREFIX, ...args),
  debug: (...args: unknown[]) => console.debug(SPOTLIGHT_PREFIX, ...args),
};

let isLoggingEnabled = false;
let currentLogger: BaseLogger = defaultLogger;

export function enableLogging(enabled: boolean): void {
  isLoggingEnabled = enabled;
  currentLogger = enabled ? defaultLogger : noopLogger;
}

export function getLoggingState(): boolean {
  return isLoggingEnabled;
}

export function getLogger(): BaseLogger {
  return currentLogger;
}

export function createLoggerWithContext(enabled: boolean): BaseLogger {
  return enabled ? defaultLogger : noopLogger;
}
