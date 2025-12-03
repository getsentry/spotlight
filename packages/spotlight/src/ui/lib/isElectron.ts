/**
 * Build-time constant that indicates if running in Electron.
 * Set to `true` by vite.electron.config.ts, `false` or undefined otherwise.
 * Uses typeof check to safely handle undefined without throwing.
 */
export const IS_ELECTRON = typeof __IS_ELECTRON__ !== "undefined" && __IS_ELECTRON__;

