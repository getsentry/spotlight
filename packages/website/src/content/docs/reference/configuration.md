---
title: Configuration
description: All the configuration options for setting up Spotlight
---

## Configure `spotlight`

```js
import * as Spotlight from '@spotlightjs/core';

Spotlight.init({
  integrations: [sentry()],
});
```

### `integrations`

**type:** [`SpotlightIntegration[]`](#spotlightintegration)

Defines which integrations should be loaded for Spotlight.

#### `SpotlightIntegration`

```ts
// TODO
type SpotlightIntegration = {};
```

### `sidecar`

**type:** string

The Sidecar event-source stream endpoint.

```js
Spotlight.init({
  sidecar: 'http://localhost:8969/stream',
});
```

### `anchor`

**type:** [`AnchorConfig`](#anchorconfig)

The anchor position for the toolbar.

```js
Spotlight.init({
  anchor: 'centerRight',
});
```

#### `AnchorConfig`

```ts
type AnchorConfig = 'bottomRight' | 'bottomLeft' | 'centerRight' | 'centerLeft' | 'topLeft' | 'topRight';
```
