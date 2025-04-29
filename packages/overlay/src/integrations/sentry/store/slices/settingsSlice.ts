import { CONTEXT_LINES_ENDPOINT } from '@spotlightjs/sidecar/constants';
import { StateCreator } from 'zustand';
import { DEFAULT_SIDECAR_URL } from '~/constants';
import type { SentryStore, SettingsSliceActions, SettingsSliceState } from '../types';

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
