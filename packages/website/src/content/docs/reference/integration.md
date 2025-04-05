---
title: Integration
description: Interface of an integration
---

```ts
export type SpotlightContext = {
  open: (path: string | undefined) => void;
  close: () => void;
};

export type Integration<T = any> = {
  /**
   * Name of the integration
   */
  name: string;

  /**
   * The content-type http headers determining which events dispatched to spotlight
   * events should be forwarded to this integration.
   *
   * For example: ["application/x-sentry-envelope"]
   */
  forwardedContentType?: string[];

  /**
   * A function returning an array of tabs to be displayed in the UI.
   *
   * @param context contains the processed events for the tabs. Use this information to
   * e.g. update the notification count badge of the tab.
   */
  tabs?: TabsCreationFunction<T>;

  /**
   * Setup hook called when Spotlight is initialized.
   *
   * Use this hook to setup any global state, instrument handlers, etc.
   */
  setup?: (context: SpotlightContext) => void | Promise<void>;

  /**
   * Hook called whenever spotlight forwards a new raw event to this integration.
   *
   * Use this hook to process and convert the raw request payload (string) to a
   * data structure that your integration works with in the UI.
   *
   * If you want to disregard the sent event, simply return `undefined`.
   *
   * The returned object will be passed to your tabs function.
   */
  processEvent?: (eventContext: RawEventContext) => ProcessedEventContainer<T> | undefined;

  /**
   * To reset the integration.
   *
   * @returns void
   */
  reset?: () => void;

  /**
   * Wait for the integration to be ready before displaying the UI.
   * This is useful if you need to load some data before displaying the UI.
   *
   * For example, if you need to load some data from the server or
   * if you need to wait for some other async operation to complete.
   *
   * This function will be called after the setup function and before the UI is displayed.
   * If this function returns a promise, the UI will not be displayed until the promise is resolved.
   * @returns void | Promise<void>
   */
  waitForUpdates?: () => void | Promise<void>;
};
```
