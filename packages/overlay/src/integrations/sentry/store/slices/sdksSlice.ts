import { StateCreator } from 'zustand';
import { Sdk, SentryEvent } from '../../types';
import type { SDKsSliceActions, SDKsSliceState, SentryStore } from '../types';

const initialSDKsState: SDKsSliceState = {
  sdks: [],
};

export const createSDKsSlice: StateCreator<SentryStore, [], [], SDKsSliceState & SDKsSliceActions> = (_set, get) => ({
  ...initialSDKsState,
  inferSdkFromEvent: (event: SentryEvent) => {
    const sdk: Sdk = {
      name: 'unknown',
      version: 'unknown',
      lastSeen: new Date().getTime(),
    };

    if (event.sdk) {
      sdk.name = event.sdk.name || sdk.name;
      sdk.version = event.sdk.version || sdk.version;
    } else if (event.platform) {
      sdk.name = event.platform;
    }

    return sdk;
  },
  getSdks: () => get().sdks,
});
