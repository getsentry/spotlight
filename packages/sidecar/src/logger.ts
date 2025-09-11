import type { SidecarLogger } from "./types/index.js";

const SPOTLIGHT_PREFIX = "🔎 [Spotlight]";

const defaultLogger: SidecarLogger = {
  info: message => console.log(SPOTLIGHT_PREFIX, message),
  warn: message => console.warn(SPOTLIGHT_PREFIX, message),
  error: message => console.error(SPOTLIGHT_PREFIX, message),
  debug: message => debugEnabled && console.debug(SPOTLIGHT_PREFIX, message),
};

let injectedLogger: SidecarLogger | undefined = undefined;
let debugEnabled = false;

export function activateLogger(logger: SidecarLogger): void {
  injectedLogger = logger;
}

export function enableDebugLogging(debug: boolean): void {
  debugEnabled = debug;
}

export function isDebugEnabled(): boolean {
  return debugEnabled;
}

export const logger: SidecarLogger = {
  info: message => (injectedLogger || defaultLogger).info(message),
  warn: message => (injectedLogger || defaultLogger).warn(message),
  error: message => (injectedLogger || defaultLogger).error(message),
  debug: message => (injectedLogger || defaultLogger).debug(message),
};
