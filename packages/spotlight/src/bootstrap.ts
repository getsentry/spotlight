// Bootstrap script to load the appropriate entry point based on the environment
// Check multiple methods to detect if the app is running in Electron even on dev builds
const isElectronEnv =
  (typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron")) ||
  (typeof process !== "undefined" && process.versions?.electron) ||
  (typeof window !== "undefined" && window.location.protocol === "file:");

if (isElectronEnv) {
  // Set global flag for Electron detection in React components
  // This must be set before the app loads so components can check it
  if (typeof window !== "undefined") {
    (window as { __SPOTLIGHT_IS_ELECTRON__?: boolean }).__SPOTLIGHT_IS_ELECTRON__ = true;
  }
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
