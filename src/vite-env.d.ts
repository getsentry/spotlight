/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sentry-spotlight-trigger": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
