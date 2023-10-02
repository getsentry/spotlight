---
title: Configuration
description: All the configuration options for setting up Spotlight
---

## Configure `spotlight`

```js
import * as Spotlight from '@sentry/spotlight';

Spotlight.init({
    plugins: ['sentry']
});
```


### `plugins`

*type:* `string[]`

Defines which plugins should be loaded for Spotlight.