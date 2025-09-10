import type { SidecarLogger } from "./types/index.js";

const defaultLogger: SidecarLogger = {
  info: message => console.log("🔎 [Spotlight]", message),
  warn: message => console.warn("🔎 [Spotlight]", message),
  error: message => console.error("🔎 [Spotlight]", message),
  debug: message => debugEnabled && console.debug("🔎 [Spotlight]", message),
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
