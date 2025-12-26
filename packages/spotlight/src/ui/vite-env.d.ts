/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/**
 * Build-time constant set by vite.electron.config.ts for Electron builds.
 * In non-Electron builds, this will be undefined.
 */
declare const __IS_ELECTRON__: boolean | undefined;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sentry-spotlight-trigger": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
