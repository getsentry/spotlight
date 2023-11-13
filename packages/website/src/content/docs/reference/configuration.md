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

_type:_ `<SpotlightIntegration>[]`

Defines which integrations should be loaded for Spotlight.
