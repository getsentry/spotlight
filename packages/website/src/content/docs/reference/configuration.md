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

#### `injectImmediately`

**type:** `boolean` **default:** `false`

By default, Spotlight waits until the host page is loaded before injecting the Spotlight Overlay. Depending on how and
when the `init` call is made, the `load` event might have already happened.

By setting `injectImmediately` to `true`, the UI will be injected synchronously with the `init` call.

Use this option, if you called `init()` but the Spotlight Overlay UI is not visible.

```ts
init({
  injectImmediately: true,
});
```

#### `openOnInit`

**type:** `boolean` **default:** `false`

If set to `true`, the Spotlight overlay Window will be opened immediately after calling the init function. By default,
only the button is visible.

```ts
init({
  opneOnInit: true,
});
```

#### `fullPage`

**type:** `boolean` **default:** `false`

If set to `true`, the Spotlight overlay will be rendered directly in the HTML as a relative `<div/>`. It's helpful and
goes well with `injectImmediately`. It's used for rendering a blocking page like an error page or dedicated HTML. Also
the ability for closing the overlay is disabled when this is avitce.

```ts
init({
  fullPage: true,
});
```

#### `showClearEventsButton`

**type:** `boolean` **default:** `true`

If set to `true`, the Spotlight overlay will have a clear events button on top. On clicking the button, all events
processed from sidecar will be removed.

```ts
init({
  showClearEventsButton: true,
});
```

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
