---
'@spotlightjs/overlay': major
'@spotlightjs/astro': major
---

feat: Make Spotlight compatible with v8 of Sentry JS SDKs

This is a breaking change due to changes in the JS SDK's `Integration` API, making Spotlight no longer compatible with
v7 SDKs.

Other than that, there are **no public API changes**, meaning, you don't have to change anything in your code other than
ensuring that you use a `@sentry/<your-sdk>@8` SDK with the new version of Spotlight.

Given that JS SDK v8 is not yet stable, this change is first going to be released as an alpha version.
