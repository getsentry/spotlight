export function getSpotlightContainer(): HTMLElement | null {
  // First try to get the root element
  const spotlightRoot = document.getElementById('sentry-spotlight-root');
  if (!spotlightRoot) {
    console.warn('Spotlight root not found');
    return null;
  }

  // Get the shadow root
  const shadowRoot = spotlightRoot.shadowRoot;
  if (!shadowRoot) {
    console.warn('Shadow root not found');
    return null;
  }

  // Get the debugger container
  const debuggerContainer = shadowRoot.querySelector('.spotlight-debugger');
  if (!debuggerContainer) {
    console.warn('Spotlight debugger container not found');
    return null;
  }

  return debuggerContainer as HTMLElement;
}
