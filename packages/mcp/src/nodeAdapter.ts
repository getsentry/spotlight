import type { StateCreator } from "zustand";
import { create } from "zustand";

// Re-export overlay types from dist files
export { processEnvelope } from "@spotlightjs/overlay/dist/integrations/sentry/index.js";

export type {
  SentryEvent,
  Trace,
  SentryLogEventItem,
  Sdk,
  SentryErrorEvent,
} from "@spotlightjs/overlay/dist/integrations/sentry/types.js";

export type {
  SentryStore,
  EventsSliceState,
  EventsSliceActions,
  TracesSliceState,
  TracesSliceActions,
  LogsSliceState,
  LogsSliceActions,
  ProfilesSliceState,
  ProfilesSliceActions,
  SettingsSliceState,
  SettingsSliceActions,
  SharedSliceActions,
  SentryProfileWithTraceMeta,
} from "@spotlightjs/overlay/dist/integrations/sentry/store/types.js";

// Re-export types from @sentry/core since they're used in integration
export type { Envelope, EnvelopeItem } from "@sentry/core";
export type { RawEventContext } from "@spotlightjs/overlay/dist/integrations/integration.js";

/**
 * Environment detection utility
 */
export const isNodeEnvironment = typeof (globalThis as any).window === "undefined";

/**
 * Node.js compatible fetch implementation
 * Uses global fetch (available in Node 18+)
 */
export function createNodeFetch(): typeof fetch {
  if (isNodeEnvironment) {
    // Node.js environment - use global fetch (Node 18+)
    return globalThis.fetch;
  }
  // Fallback for browser (shouldn't happen in sidecar)
  return globalThis.fetch;
}

/**
 * Skip browser-only setup functions in Node.js environment
 */
export function skipBrowserOnlySetup<T>(browserFn: () => T, nodeFallback?: () => T): T | undefined {
  if (isNodeEnvironment) {
    return nodeFallback?.();
  }
  return browserFn();
}

/**
 * Create Node.js compatible store creator
 */
export function createNodeStore<T>(storeCreator: StateCreator<T>) {
  return create<T>()(storeCreator);
}
