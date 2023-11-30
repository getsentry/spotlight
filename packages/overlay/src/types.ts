import { Anchor } from './components/Trigger';
import { Integration } from './integrations/integration';

export type SpotlightOverlayOptions = {
  /**
   * Array of Spotlight integrations to enable when the Overlay initializes.
   *
   * Usage:
   * ```js
   * integrations: [sentry(), myIntegration()]
   * ```
   *
   * @default [sentry()]
   */
  integrations?: Integration[];

  /**
   * TODO: Rename
   *
   * If set to `true`, the Spotlight overlay Window will be opened immediately
   * after calling the init.
   *
   * @default false - only the Spotlight button is visible.
   */
  fullScreen?: boolean;

  /**
   * Set a URL to a custom Spotlight Sidecar instance. The Spotlight overlay
   * will use this URL instead of the default URL to connect to the sidecar
   * and to listen to incoming events.
   *
   * @default "http://localhost:8969/stream"
   */
  sidecarUrl?: string;

  /**
   * If set to `false`, the Spotlight button will not be visible.
   * This is useful if Spotlight is integrated into an existing UI,
   * such as the Astro Dev Overlay.
   *
   * @default true
   */
  showTriggerButton?: boolean;

  /**
   * By default, Spotlight waits until the host page is loaded before injecting the
   * Spotlight Overlay. Depending on how and when the init call is made, the load
   * event might have already happened.
   *
   * Setting injectImmediately to `true`, will inject the UI synchronously with the
   * `init` call, regardless of the host page's load state.
   *
   * Use this option, if you called `init()` but the Spotlight Overlay UI is not visible.
   *
   * @default false
   */
  injectImmediately?: boolean;

  /**
   * Set this option to define where the spotlight button should be anchored.
   *
   * @default "bottomRight"
   */
  anchor?: Anchor;

  /**
   * If set to `true`, the Spotlight overlay will log additional debug messages to the console.
   *
   * @default false
   */
  debug?: boolean;

  /**
   * TODO: Remove? No longer needed with new approach
   */
  defaultEventId?: string;
};

export type TriggerButtonCount = {
  general: number;
  severe: number;
};

export type WindowWithSpotlight = Window & {
  __spotlight?: {
    eventTarget?: EventTarget;
  };
};
