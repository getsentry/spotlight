// Bootstrap script to load the appropriate entry point based on the environment
// With nodeIntegration: true, process is available in Electron renderer
if (typeof process !== 'undefined' && process.versions?.electron) {
  // Load Electron entry point with proper Sentry initialization
  import('./electron-index.tsx');
} else {
  // Load web entry point
  import('./index.tsx').then(m => m._init({ debug: true }));
}

