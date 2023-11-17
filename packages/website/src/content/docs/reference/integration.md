---
title: Integration
description: Interface of an intergration
---

```ts
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
  setup?: () => void | Promise<void>;

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
};
```
