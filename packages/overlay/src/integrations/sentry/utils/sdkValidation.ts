import { SDK_VERSION_SUPPORT_REGEX } from '../constants';
import { WindowWithSentry } from '../types';

export function checkBrowserSDKVersion() {
  const spotlightV1SupportedSentryRegex = new RegExp(SDK_VERSION_SUPPORT_REGEX);
  const sentrySDKVersion = (window as WindowWithSentry).__SENTRY__?.hub?.getClient()?.getOptions()?._metadata?.sdk
    ?.version;

  // if browser SDK verion not found, return true to load the events from server side.
  return sentrySDKVersion ? spotlightV1SupportedSentryRegex.test(sentrySDKVersion) : true;
}
