/**
 * teturns a namespaced sessionStorage key for storing the last route.
 * @param contextId unique identifier for the current context (e.g., sidecarUrl or window.location.origin)
 */
export function getRouteStorageKey(contextId: string) {
  return `spotlight:lastRoute:${contextId}`;
}
