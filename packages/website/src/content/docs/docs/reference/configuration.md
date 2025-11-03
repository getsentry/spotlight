---
title: Configuration
description: All the configuration options for setting up Spotlight
---

## `init`

To initialize spotlight in your app using following configuration options:

#### `integrations`

**type:** [`SpotlightIntegration[]`](#spotlightintegration)

Defines which integrations should be loaded for Spotlight. Defaults to `[sentry()]`.

```js
import { init, sentry } as Spotlight from '@spotlightjs/spotlight';

init({
  integrations: [sentry()],
});
```

#### `debug`

**type:** `boolean` **default:** `false`

Enables some debug output in console for debugging.

```ts
init({
  debug: true,
});
```

#### `sidecarUrl`

**type:** `string` **default:** `"http://localhost:8969/stream"`

The Sidecar event-source stream endpoint URL.

Set this option if you have the sidecar running on another URL than the default one.

```ts
init({
  sidecarUrl: 'http://localhost:8969/stream',
});
```

#### `anchor`

**type:** [`AnchorConfig`](#anchorconfig)

The anchor position for the toolbar.

```ts
init({
  anchor: 'centerRight',
});
```

#### `experiments`

**type:** [`ExperimentsConfig`](#experimentsconfig)

Experimental configuration.

```ts
init({
  experiments: {
    'sentry:focus-local-events': false,
  },
});
```

#### `AnchorConfig`

```ts
type AnchorConfig = 'bottomRight' | 'bottomLeft' | 'centerRight' | 'centerLeft' | 'topLeft' | 'topRight';
```

#### `ExperimentsConfig`

```ts
type ExperimentsConfig = Record<ExperimentName, boolean>;
```

Experiment names are:

- `sentry:focus-local-events` - if set to true, errors and traces will hide events from other sessions when possible.

:::note[Deprecated Options]
The following options were part of the deprecated embedded overlay model. Spotlight now runs as a standalone UI accessed at `http://localhost:8969` instead of being embedded in your application.

If you need these features, consider using the desktop app or accessing the standalone UI in a separate browser window/tab.
:::

#### `injectImmediately` (Deprecated)

**type:** `boolean` **default:** `false`

Previously controlled when the embedded overlay was injected into the page. No longer applicable with the standalone UI model.

#### `openOnInit` (Deprecated)

**type:** `boolean` **default:** `false`

Previously opened the embedded overlay window immediately. No longer applicable with the standalone UI model.

#### `fullPage` (Deprecated)

**type:** `boolean` **default:** `false`

Previously rendered the overlay as a full-page element. No longer applicable with the standalone UI model.

#### `showClearEventsButton` (Deprecated)

**type:** `boolean` **default:** `true`

The standalone UI includes a clear events button by default. This option is no longer configurable.

## `trigger`

Trigger an event within Spotlight.

```js
import { trigger } from '@spotlightjs/spotlight';

trigger('sentry:showError', {
  event: string,
  eventId: string,
});
```

```ts
type TriggerFunction = (eventName: string, eventPayload?: unknown)
```

## `SpotlightIntegration`

```ts
// TODO
type SpotlightIntegration = {};
```
