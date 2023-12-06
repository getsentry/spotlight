# Spotlight for Astro

This is package is specifically built to add Spotlight to your Astro application with one command.

## Installation

```js
npx astro add @sentry/astro @spotlightjs/astro
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';

// https://astro.build/config
export default defineConfig({
  // Order matters here!  `sentry()` should come before `spotlightjs()`
  integrations: [sentry(), spotlightjs()],
});
```
