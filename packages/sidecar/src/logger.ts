import { enableLogging, getLogger, getLoggingState } from "@spotlightjs/core";

export type SidecarLogger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
};

let injectedLogger: SidecarLogger | undefined = undefined;

export function activateLogger(logger: SidecarLogger): void {
  injectedLogger = logger;
}

export function enableDebugLogging(debug: boolean): void {
  enableLogging(debug);
}

export function isDebugEnabled(): boolean {
  return getLoggingState();
}

function routeLog(method: keyof SidecarLogger, ...args: unknown[]): void {
  if (injectedLogger) {
    injectedLogger[method](...args);
  } else {
    getLogger()[method](...args);
  }
}

export const logger = {
  info: (...args: unknown[]) => routeLog("info", ...args),
  warn: (...args: unknown[]) => routeLog("warn", ...args),
  error: (...args: unknown[]) => routeLog("error", ...args),
  debug: (...args: unknown[]) => routeLog("debug", ...args),
};
