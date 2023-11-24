/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sentry-spotlight-trigger': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
