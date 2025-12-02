/**
 * Utility to detect if the app is running inside Electron.
 *
 * Detection methods (in order of reliability):
 * 1. User agent check - Electron always includes "Electron" in navigator.userAgent
 * 2. Global flag set during bootstrap
 * 3. file:// protocol (production Electron)
 * 4. process.versions.electron (if nodeIntegration works)
 *
 * This utility provides consistent detection across all components with debug logging.
 */

declare global {
  interface Window {
    __SPOTLIGHT_IS_ELECTRON__?: boolean;
  }
}

export function isElectron(): boolean {
  const fromUserAgent = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron");

  const fromGlobalFlag = typeof window !== "undefined" && window.__SPOTLIGHT_IS_ELECTRON__ === true;

  const fromProtocol = typeof window !== "undefined" && window.location.protocol === "file:";

  const fromProcess = typeof process !== "undefined" && !!process.versions?.electron;

  const result = fromUserAgent || fromGlobalFlag || fromProtocol || fromProcess;

  return result;
}
