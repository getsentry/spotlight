import { create } from 'zustand';
import {
  // ✅ These slices work directly in Node.js (no changes needed!)
  createEventsSlice,
  createTracesSlice,
  createLogsSlice,
  createProfilesSlice,
  createSDKsSlice,
  createEnvelopesSlice,  
  createSubscriptionsSlice,
} from '@spotlightjs/overlay/dist/integrations/sentry/store/index.js';

import type { SentryStore } from './nodeAdapter.js';
import { createNodeSettingsSlice, createNodeSharedSlice } from './nodeCompatibilityLayer.js';

// Create Node.js compatible Sentry store - mostly direct imports!
export const useSidecarSentryStore = create<SentryStore>()((...args) => ({
  // ✅ Direct imports - these work in Node.js as-is
  ...createEventsSlice(...args),
  ...createTracesSlice(...args),
  ...createLogsSlice(...args),
  ...createProfilesSlice(...args),
  ...createSDKsSlice(...args),
  ...createEnvelopesSlice(...args),
  ...createSubscriptionsSlice(...args),
  
  // 🔧 Only these two need Node.js adaptation
  ...createNodeSettingsSlice(...args),
  ...createNodeSharedSlice(...args),
}));

export type SidecarSentryStore = typeof useSidecarSentryStore;