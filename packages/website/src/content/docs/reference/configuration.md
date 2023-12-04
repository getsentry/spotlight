---
title: Configuration
description: All the configuration options for setting up Spotlight
---

## `init`

```js
import { init, sentry } as Spotlight from '@spotlightjs/spotlight';

init({
  integrations: [sentry()],
});
```

### `integrations`

**type:** [`SpotlightIntegration[]`](#spotlightintegration)

Defines which integrations should be loaded for Spotlight. Defaults to `[sentry()]`.

```ts
init({
  integrations: [sentry()],
});
```

#### `SpotlightIntegration`

```ts
// TODO
type SpotlightIntegration = {};
```

### `debug`

**type:** `boolean` **default:** `false`

Enables some debug output in console for debugging.

```ts
init({
  debug: true,
});
```

### `sidecarUrl`

**type:** `string` **default:** `"http://localhost:8969/stream"`

The Sidecar event-source stream endpoint URL.

Set this option if you have the sidecar running on another URL than the default one.

```ts
init({
  sidecar: 'http://localhost:8969/stream',
});
```

### `anchor`

**type:** [`AnchorConfig`](#anchorconfig)

The anchor position for the toolbar.

```ts
init({
  anchor: 'centerRight',
});
```

#### `AnchorConfig`

```ts
type AnchorConfig = 'bottomRight' | 'bottomLeft' | 'centerRight' | 'centerLeft' | 'topLeft' | 'topRight';
```

### `injectImmediately`

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

### `openOnInit`

**type:** `boolean` **default:** `false`

If set to `true`, the Spotlight overlay Window will be opened immediately after calling the init function. By default,
only the button is visible.

## `trigger`

Trigger an event within Spotlight.

```js
import { trigger } from '@spotlightjs/spotlight';

trigger("sentry:showError", {
  event: string,
  eventId: string,
});
```

```ts
type TriggerFunction = (eventName: string, eventPayload?: unknown)
```
