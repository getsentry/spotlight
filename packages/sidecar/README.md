# Spotlight Sidecar

The Spotlight Sidecar is a small proxy server that allows (development) servers to send data to Spotlight.

## Installation

```js
npm install @spotlightjs/sidecar
```

## Usage

```js
import { setupSidecar } from '@spotlightjs/sidecar';

// When you start your dev server
setupSidecar();
```
