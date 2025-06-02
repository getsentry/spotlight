export const SPOTLIGHT_PREFIX = "🔎 [Spotlight]";

const noop = (..._args: unknown[]) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars
let _log = noop;
let _warn = noop;

export function activateLogger() {
  _log = (...args: unknown[]) => console.log(SPOTLIGHT_PREFIX, ...args);
  _warn = (...args: unknown[]) => console.warn(SPOTLIGHT_PREFIX, ...args);
}

export function deactivateLogger() {
  _log = noop;
  _warn = noop;
}

export function log(...args: unknown[]) {
  _log(...args);
}

export function warn(...args: unknown[]) {
  _warn(...args);
}
