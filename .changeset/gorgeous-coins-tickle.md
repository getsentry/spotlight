---
'@spotlightjs/spotlight': major
'@spotlightjs/electron': major
'@spotlightjs/overlay': major
'@spotlightjs/astro': major
---

feat: Drop Support for JS SDK <7.99.0 and add support for JS SDK 8.x

The Spotlight UI (overlay) was updated to version 2 to ensure compatibility with version 8 of Sentry's JavaScript SDKs.

Here's what you need to do to update to the new major version:

- If you're using a Sentry JavaScript SDK on your host app where the spotlight overlay is running, ensure that you use
  version `8` or `>=7.99.0` of your `@sentry/<sdk>` SDK. Older v7 versions will not work correctly anymore.
- Good news: There are **no public API** changes! You don't need to make any changes to your code.
