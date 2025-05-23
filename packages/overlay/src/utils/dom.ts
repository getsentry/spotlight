export function getSpotlightContainer(): HTMLElement | null {
  const spotlightRoot = document.getElementById('sentry-spotlight-root');
  if (!spotlightRoot) {
    console.warn('Spotlight root not found');
    return null;
  }
  const shadowRoot = spotlightRoot.shadowRoot;
  if (!shadowRoot) {
    console.warn('Shadow root not found');
    return null;
  }
  const debuggerContainer = shadowRoot.querySelector('.spotlight-debugger');
  if (!debuggerContainer) {
    console.warn('Spotlight debugger container not found');
    return null;
  }

  return debuggerContainer as HTMLElement;
}
