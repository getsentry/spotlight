declare global {
  interface Window {
    __ELECTRON_PLATFORM__?: NodeJS.Platform;
  }
}

/**
 * Build-time constant that indicates if running in Electron.
 * Set to `true` by vite.electron.config.ts, `false` or undefined otherwise.
 * Uses typeof check to safely handle undefined without throwing.
 */
export const IS_ELECTRON = typeof __IS_ELECTRON__ !== "undefined" && __IS_ELECTRON__;

/**
 * Runtime constant that provides the platform when running in Electron.
 * Injected by the Electron main process on page load.
 */
export const ELECTRON_PLATFORM: NodeJS.Platform | undefined =
  typeof window !== "undefined" ? window.__ELECTRON_PLATFORM__ : undefined;
