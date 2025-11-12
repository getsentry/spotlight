/**
 * returns a namespaced sessionStorage key for storing the last route.
 * @param contextId unique identifier for the current context, current sidecarUrl
 */
export function getRouteStorageKey(contextId: string) {
  return `spotlight:lastRoute:${contextId}`;
}
