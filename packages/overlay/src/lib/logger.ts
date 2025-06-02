import type { WindowWithSpotlight } from "../types";

export const SPOTLIGHT_PREFIX = "🔎 [Spotlight]";

const windowWithSpotlight = window as WindowWithSpotlight;
if (!windowWithSpotlight.__spotlight) {
  windowWithSpotlight.__spotlight = {};
}
if (!windowWithSpotlight.__spotlight.console) {
  windowWithSpotlight.__spotlight.console = {};
}

if (!windowWithSpotlight.__spotlight.console.log) {
  windowWithSpotlight.__spotlight.console.log = window.console.log;
}

if (!windowWithSpotlight.__spotlight.console.warn) {
  windowWithSpotlight.__spotlight.console.warn = window.console.warn;
}

const original = windowWithSpotlight.__spotlight.console;

const noop = (..._args: unknown[]) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars
let _log = noop;
let _warn = noop;

export function activateLogger() {
  _log = (...args: unknown[]) => original.log.call(window, SPOTLIGHT_PREFIX, ...args);
  _warn = (...args: unknown[]) => original.warn.call(window, SPOTLIGHT_PREFIX, ...args);
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
