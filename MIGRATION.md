# Updating from Spotlight 1.x to 2.x

Spotlight was updated to version 2 to ensure compatibility with version 8 of Sentry's JavaScript SDKs.

Here's what you need to do to update to version 2:

- Ensure that you use version `8` or `>=7.99.0` of your `@sentry/<sdk>` SDKs. Older v7 versions will not work correctly
  anymore.
- Good news: There are **no public API** changes! You don't need to make any changes to your code.

## Details

The reason for publishing a Spotlight major version is that if Spotlight's Sentry integration is used (enabled by
default), the Spotlight overlay interacts with the Sentry SDK in the overlay's host page. The SDK APIs the overlay
interacted with changed, which required changes in the Spotlight overlay that are no longer compatible with v7 versions
prior to `7.99.0` of the Sentry JS SDKs. Hence, we can't support all v7 and v8 SDK versions in one Spotlight version.

If you're using older v7 versions than `7.99.0`, consider upgrading to version `8` or `>=7.99.0`.
