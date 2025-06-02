import { create } from "zustand";
import { createEnvelopesSlice } from "./slices/envelopesSlice";
import { createEventsSlice } from "./slices/eventsSlice";
import { createLogsSlice } from "./slices/logsSlice";
import { createProfilesSlice } from "./slices/profilesSlice";
import { createSDKsSlice } from "./slices/sdksSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createSharedSlice } from "./slices/sharedSlice";
import { createSubscriptionsSlice } from "./slices/subscriptionsSlice";
import { createTracesSlice } from "./slices/tracesSlice";
import type { SentryStore, SharedSliceActions } from "./types";

const useSentryStore = create<SentryStore & SharedSliceActions>()((...a) => ({
  ...createEventsSlice(...a),
  ...createTracesSlice(...a),
  ...createProfilesSlice(...a),
  ...createSubscriptionsSlice(...a),
  ...createSettingsSlice(...a),
  ...createEnvelopesSlice(...a),
  ...createSDKsSlice(...a),
  ...createLogsSlice(...a),
  ...createSharedSlice(...a),
}));

export default useSentryStore;
