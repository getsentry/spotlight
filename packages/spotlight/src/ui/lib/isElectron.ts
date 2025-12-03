/**
 * Utility to detect if the app is running inside Electron.
 *
 * Detection methods (in order of reliability):
 * 1. Build-time constant __IS_ELECTRON__ set by Vite in electron builds
 * 2. User agent check - Electron always includes "Electron" in navigator.userAgent
 * 3. file:// protocol (production Electron)
 */

declare const __IS_ELECTRON__: boolean | undefined;

export function isElectron(): boolean {
  // Build-time constant from Vite (most reliable for electron builds)
  if (typeof __IS_ELECTRON__ !== "undefined" && __IS_ELECTRON__) {
    return true;
  }

  // Runtime detection fallbacks
  const fromUserAgent = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron");
  const fromProtocol = typeof window !== "undefined" && window.location.protocol === "file:";

  return fromUserAgent || fromProtocol;
}
