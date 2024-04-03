let loggerActive = false;

export function activateLogger() {
  loggerActive = true;
}

export function deactivateLogger() {
  loggerActive = false;
}

export function log(...args: unknown[]) {
  if (loggerActive) {
    console.log('🔎 [Spotlight]', ...args);
  }
}

export function warn(...args: unknown[]) {
  if (loggerActive) {
    console.warn('🔎 [Spotlight]', ...args);
  }
}
