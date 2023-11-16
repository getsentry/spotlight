# Spotlight for Astro

This is package is specifically built to add Spotlight to your Astro application with one command.

## Installation

```js
npx astro add @spotlightjs/astro
```

## Usage

```js
// astro.config.mjs
import spotlight from '@spotlightjs/astro';

export default defineConfig({
  integrations: [spotlight()],
});
```
