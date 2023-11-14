# Spotlight Core

This is the core package to add Spotlight to your application

## Installation

```js
npm install @spotlightjs/core
```

## Usage

```js
import * as Spotlight from '@spotlightjs/core';

Spotlight.init({
  integrations: [Spotlight.sentry(), Spotlight.console()],
  showTriggerButton: true,
});
```
