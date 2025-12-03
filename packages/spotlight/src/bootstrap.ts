// Bootstrap script to load the appropriate entry point based on the environment
// __IS_ELECTRON__ is set to true at build time by vite.electron.config.ts

declare const __IS_ELECTRON__: boolean | undefined;

if (typeof __IS_ELECTRON__ !== "undefined" && __IS_ELECTRON__) {
  // Load Electron entry point with proper Sentry initialization
  import("./electron-index.tsx");
} else {
  // Load web entry point
  // Initialize Sentry first, then the app
  Promise.all([import("./ui/lib/instrumentation"), import("./index.tsx")]).then(([instrumentation, index]) => {
    instrumentation.default(); // Call initSentry()
    return index._init();
  });
}
