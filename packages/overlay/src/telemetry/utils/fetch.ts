type FetchImpl = typeof fetch;
type WrappedFetchImpl = FetchImpl & { __sentry_original__: FetchImpl };

/**
 * We want to get an unpatched fetch implementation to avoid capturing our own calls.
 */
export function getNativeFetchImplementation(): FetchImpl {
  if (fetchIsWrapped(window.fetch)) {
    return window.fetch.__sentry_original__;
  }

  return window.fetch;
}

function fetchIsWrapped(fetchImpl: FetchImpl): fetchImpl is WrappedFetchImpl {
  return "__sentry_original__" in fetchImpl;
}
