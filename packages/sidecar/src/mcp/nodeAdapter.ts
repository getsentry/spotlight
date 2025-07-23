import type { StateCreator } from 'zustand';
import { create } from 'zustand';

// Re-export overlay types and utilities for Node.js use
export { 
  processEnvelope,
  type SentryEvent,
  type Trace,
  type SentryLogEventItem,
  type SentryProfileWithTraceMeta,
  type Sdk,
  type RawEventContext,
  type Envelope,
  type EnvelopeItem
} from '@spotlightjs/overlay/dist/integrations/sentry/index.js';

// Re-export store types
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
  SentryErrorEvent
} from '@spotlightjs/overlay/dist/integrations/sentry/store/types.js';

/**
 * Environment detection utility
 */
export const isNodeEnvironment = typeof window === 'undefined';

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
  return window.fetch;
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
export function createNodeStore<T>(storeCreator: StateCreator<T>): ReturnType<typeof create<T>> {
  return create<T>()(storeCreator);
}