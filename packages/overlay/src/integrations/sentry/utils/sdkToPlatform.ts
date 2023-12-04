/**
 * Normalizes SDK name to a platform. Can be as specific or unspecific as we support different platforms and SDKs.
 */
export function sdkToPlatform(name: string) {
  if (name.includes('javascript.astro')) return 'javascript.astro';
  if (name.includes('javascript')) return 'javascript';
  if (name.includes('python')) return 'python';
  if (name.includes('php')) return 'php';
  if (name.includes('ruby')) return 'ruby';
  return 'unknown';
}
