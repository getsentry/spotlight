import { CONTEXT_LINES_ENDPOINT } from "@spotlight/shared/constants.ts";
import { DEFAULT_SIDECAR_URL } from "@spotlight/ui/constants";
import type { StateCreator } from "zustand";
import type { SentryStore, SettingsSliceActions, SettingsSliceState } from "../types";

const initialSettingsState: SettingsSliceState = {
  contextLinesProvider: new URL(CONTEXT_LINES_ENDPOINT, DEFAULT_SIDECAR_URL).href,
};

export const createSettingsSlice: StateCreator<
  SentryStore,
  [],
  [],
  SettingsSliceState & SettingsSliceActions
> = set => ({
  ...initialSettingsState,
  setSidecarUrl: (url: string) => {
    const { href: contextLinesProviderUrl } = new URL(CONTEXT_LINES_ENDPOINT, url);
    set({ contextLinesProvider: contextLinesProviderUrl });
  },
});
