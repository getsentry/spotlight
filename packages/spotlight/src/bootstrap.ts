// Bootstrap script to load the appropriate entry point based on the environment
// With nodeIntegration: true, process is available in Electron renderer
if (typeof process !== 'undefined' && process.versions?.electron) {
  // Load Electron entry point with proper Sentry initialization
  import('./electron-index.tsx');
} else {
  // Load web entry point
  // Initialize Sentry first, then the app
  Promise.all([import("./ui/lib/instrumentation"), import("./index.tsx")]).then(([instrumentation, index]) => {
    instrumentation.default(); // Call initSentry()
    return index._init();
  });
}

