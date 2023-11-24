---
title: IntegrationTab
description: Interface of an IntegrationTab
---

```ts
export type IntegrationTab<T> = {
  /**
   * Id of the tab. This needs to be a unique name.
   */
  id: string;

  /**
   * Title of the tab. This is what will be displayed in the UI.
   */
  title: string;

  /**
   * If this property is set, a count badge will be displayed
   * next to the tab title with the specified value.
   */
  notificationCount?: number;

  /**
   * JSX content of the tab. Go crazy, this is all yours!
   */
  content?: React.ComponentType<{
    processedEvents: T[];
  }>;

  onSelect?: () => void;
};
```
