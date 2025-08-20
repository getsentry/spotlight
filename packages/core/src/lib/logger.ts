export const SPOTLIGHT_PREFIX = "🔎 [Spotlight]";

export interface BaseLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

const noopLogger: BaseLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const defaultLogger: BaseLogger = {
  info: (message: string) => console.log(SPOTLIGHT_PREFIX, message),
  warn: (message: string) => console.warn(SPOTLIGHT_PREFIX, message),
  error: (message: string) => console.error(SPOTLIGHT_PREFIX, message),
  debug: (message: string) => console.debug(SPOTLIGHT_PREFIX, message),
};

let isLoggingEnabled = true;
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
