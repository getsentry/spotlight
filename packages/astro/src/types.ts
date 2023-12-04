export type SpotlightAstroIntegrationOptions =
  | {
      /**
       * Set this URL if you're running the Spotlight sidecar on a custom URL.
       * Setting this URL will cause server- and client-side events to be forwarded to the sidecar running on the passed URL.
       *
       * IMPORTANT: This option assumes that you manually started the sidecar outside of Astro. Therefore, if it is set,
       * the spotlight Astro integration will not start its own sidecar.
       *
       * @default 'http://localhost:8969/stream'
       */
      sidecarUrl?: string;

      /**
       * If enabled, Spotlight will log additional debug output to the console.
       */
      debug?: boolean;

      /**
       * Additional debug options.
       * WARNING: These options are not part of the public API and may change at any time.
       */
      __debugOptions?: Record<string, unknown>;
    }
  | undefined;
