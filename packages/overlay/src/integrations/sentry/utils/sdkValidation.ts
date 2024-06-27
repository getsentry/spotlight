import { SDK_VERSION_SUPPORT_REGEX } from '../constants';
import { LegacyCarrier, VersionedCarrier, WindowWithSentry } from '../types';

export function checkBrowserSDKVersion() {
  const sentrySDKVersionPreV8 = ((window as WindowWithSentry).__SENTRY__ as LegacyCarrier)?.hub
    ?.getClient()
    ?.getOptions()?._metadata?.sdk?.version;

  const sentrySDKVersionPostV8 = ((window as WindowWithSentry).__SENTRY__ as VersionedCarrier)?.version;

  // if browser SDK verion not found, return true to load the events from server side.
  return sentrySDKVersionPreV8 || sentrySDKVersionPostV8
    ? new RegExp(SDK_VERSION_SUPPORT_REGEX).test(sentrySDKVersionPreV8 || sentrySDKVersionPostV8)
    : true;
}
