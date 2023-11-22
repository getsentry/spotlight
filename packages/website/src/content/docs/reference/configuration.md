---
title: Configuration
description: All the configuration options for setting up Spotlight
---

## `init`

```js
import {init, sentry} as Spotlight from '@spotlightjs/core';

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

### `sidecar`

**type:** string

The Sidecar event-source stream endpoint.

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
