import { WindowWithSpotlight } from '~/types';

const fallbackEventTarget = new EventTarget();

/**
 * Returns the global singleton event target for spotlight.
 *
 * This is used to communicate between spotlight and the outside world.
 * To avoid instances where multiple versions of spotlight code are loaded,
 * we put the target onto the global object.
 *
 * @see https://github.com/getsentry/spotlight/issues/68
 *
 * In case of window being undefined (e.g. in SSR), we return a fallback event target.
 * which is local to one spotlight code instance.
 */
export function getSpotlightEventTarget(): EventTarget {
  if (typeof window === 'undefined') {
    return fallbackEventTarget;
  }

  const windowWithSpotlight = window as WindowWithSpotlight;

  if (!windowWithSpotlight.__spotlight) {
    windowWithSpotlight.__spotlight = {};
  }

  if (!windowWithSpotlight.__spotlight.eventTarget) {
    windowWithSpotlight.__spotlight.eventTarget = new EventTarget();
  }

  return windowWithSpotlight.__spotlight.eventTarget;
}
