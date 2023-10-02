---
title: Configuration
description: All the configuration options for setting up Spotlight
---

## Configure `spotlight`

```js
import * as Spotlight from '@sentry/spotlight';

Spotlight.init({
    integrations: [sentry()]
});
```


### `integrations`

*type:* `<SpotlightIntegration>[]`

Defines which integrations should be loaded for Spotlight.