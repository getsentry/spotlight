export type SidecarLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
};

const defaultLogger: SidecarLogger = {
  info: (message: string) => console.log('🔎 [Spotlight]', message),
  warn: (message: string) => console.warn('🔎 [Spotlight]', message),
  error: (message: string) => console.error('🔎 [Spotlight]', message),
  debug: (message: string) => debugEnabled && console.debug('🔎 [Spotlight]', message),
};

let injectedLogger: SidecarLogger | undefined = undefined;
let debugEnabled = false;

export function activateLogger(logger: SidecarLogger): void {
  injectedLogger = logger;
}

export function enableDebugLogging(debug: boolean): void {
  debugEnabled = debug;
}

export const logger = {
  info: (message: string) => (injectedLogger || defaultLogger).info(message),
  warn: (message: string) => (injectedLogger || defaultLogger).warn(message),
  error: (message: string) => (injectedLogger || defaultLogger).error(message),
  debug: (message: string) => (injectedLogger || defaultLogger).debug(message),
};
