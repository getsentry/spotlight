import { SPOTLIGHT_PREFIX, enableLogging, getLogger } from "@spotlightjs/core";

export function activateLogger() {
  enableLogging(true);
}

export function deactivateLogger() {
  enableLogging(false);
}

export function log(...args: unknown[]) {
  getLogger().info(...args);
}

export function warn(...args: unknown[]) {
  getLogger().warn(...args);
}

export { SPOTLIGHT_PREFIX };
