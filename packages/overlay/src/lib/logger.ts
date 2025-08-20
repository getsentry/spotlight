import { SPOTLIGHT_PREFIX, enableLogging, getLogger } from "@spotlightjs/core";

const noop = (..._args: unknown[]) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars
let _log = noop;
let _warn = noop;

export function activateLogger() {
  enableLogging(true);
  const logger = getLogger();

  _log = (...args: unknown[]) => {
    logger.info(args.map(arg => String(arg)).join(" "));
  };
  _warn = (...args: unknown[]) => {
    logger.warn(args.map(arg => String(arg)).join(" "));
  };
}

export function deactivateLogger() {
  enableLogging(false);
  _log = noop;
  _warn = noop;
}

export function log(...args: unknown[]) {
  _log(...args);
}

export function warn(...args: unknown[]) {
  _warn(...args);
}

// Re-export the prefix for backward compatibility
export { SPOTLIGHT_PREFIX };
