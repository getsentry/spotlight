// Import from overlay dist files - use proper package exports
import {
  createEnvelopesSlice,
  createEventsSlice,
  createLogsSlice,
  createProfilesSlice,
  createSDKsSlice,
  createSubscriptionsSlice,
  createTracesSlice,
} from "@spotlightjs/overlay/dist/integrations/sentry/store/index.js";
import { create } from "zustand";

import type { SentryStore } from "./nodeAdapter.js";
import { type ContextLinesHandler, createNodeSettingsSlice, createNodeSharedSlice } from "./nodeCompatibilityLayer.js";

// Create MCP compatible Sentry store - using proper dist exports!
export function createMcpSentryStore(contextLinesHandler?: ContextLinesHandler) {
  return create<SentryStore>()((...args) => ({
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
    ...createNodeSharedSlice(contextLinesHandler)(...args),
  }));
}

export type McpSentryStore = ReturnType<typeof createMcpSentryStore>;
