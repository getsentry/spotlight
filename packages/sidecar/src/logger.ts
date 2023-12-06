export type SidecarLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
};

const defaultLogger: SidecarLogger = {
  info: (message: string) => console.log(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
  debug: (message: string) => console.debug(message),
};

let injectedLogger: SidecarLogger | undefined = undefined;

export function activateLogger(logger: SidecarLogger): void {
  injectedLogger = logger;
}

export const logger = {
  info: (message: string) => (injectedLogger || defaultLogger).info(message),
  warn: (message: string) => (injectedLogger || defaultLogger).warn(message),
  error: (message: string) => (injectedLogger || defaultLogger).error(message),
  debug: (message: string) => (injectedLogger || defaultLogger).debug(message),
};
