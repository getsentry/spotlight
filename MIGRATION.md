# Updating from Spotlight 1.x to 2.x

Spotlight was updated to version 2 to ensure compatibility with version 8 of Sentry's JavaScript SDKs.

Here's what you need to do to update to version 2:

- Ensure that you use a version 8 of your `@sentry/<sdk>` SDKs
- Good news: There are **no public API** changes! You don't need to make any changes in your code.

## Details

The reason is that if Spotlight's Sentry integration is used (enabled by default), the Spotlight overlay interacts with
the Sentry SDK in the overlay's host page. The SDK APIs the overlay interacted with changed, which required changes in
the overlay that are no longer compatible with v7 of the Sentry SDKs. Hence, we can't support both, v7 and v8 in one
Spotlight version.
