# Spotlight

## What is Spotlight?

Spotlight is Sentry for Development. Inspired by an old project Django Debug Toolbar. Spotlight brings a rich debug
overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.

## Contributing / Running the repo

This repo is power by `pnpm`

1. `pnpm install`
2. `cd packages/website`
3. `pnpm install & pnpm build`

Step 2 & 3 are only necessary because a bug in `pnpm install`

### Run Local Dev build

If you want to locally open two terminals

One is for building & watching Spotlight locally.

1. `cd packages/spotlight`
2. `pnpm dev`

The other is to run the website locally:

1. `cd packages/website`
2. `pnpm dev`
3. `open http://localhost:4321/spotlight`

## More on Architecture

At a high level, Spotlight consists of two components:

1. An JavaScript overlay that renders inside of your application. The overlay is a simple npm package, and can
   seamlessly run in any web application (or even independently!).

2. A proxy server which which enables push-based communication to the overlay. This is achieved via a simple HTTP relay,
   allowing SDKs to push events to it (even without a DSN being configured!), and allow the overlay to receive events
   using an event stream.

To adopt Spotlight, a customer would only need to load the dependency in their application:

```shell
npm add sentry-spotlight
```

```typescript
import * as Spotlight from 'sentry-spotlight';
Spotlight.init();
```

That's it! A data relay will automatically launch from one of the SDKs, and all available SDKs will communicate with it.
No configuration is required at the SDK level.

The overlay itself behaves a little differently from Sentry. That's intentional both because this is for local
development, but also because we don't believe our production implementation of certain components is our final
implementation.

Ruight now the overlay consists of three components:

- Errors - very similar to Sentry
- Traces - all transactions get clustered into a trace view, othewrise similar to Sentry
- SDKs - simple data on which SDKs have streamed events up

We do not render Replays, Profiling data, or Attachments currently. Profiles and Attachments feel useful, Replays less
so unless you're running a remote/headless UI.
