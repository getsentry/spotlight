# @spotlightjs/tsconfig

## 2.0.0

### Major Changes

- # Add profile grafting into traces ([#692](https://github.com/getsentry/spotlight/pull/692))

  With this change, Spotlight can now ingest v1 profiles and graft profiling data into the trace view to fill in the
  gaps where span/trace instrumentation falls short.

  This feature is experimental.

  Breaking change for `tsconfig`: It now targets ES2023 as we needed `Array.findLastIndex()`

## 1.0.1

### Patch Changes

- No change, just to fix a broken release ([#576](https://github.com/getsentry/spotlight/pull/576))

## 1.0.0

### Major Changes

- meta: Bump `@spotlightjs` packages to version 1.0.0 ([#228](https://github.com/getsentry/spotlight/pull/228))

  This change sets all public `@spotlightjs` packages to major version 1.0.0. From now on, we will follow semantic
  versioning.

## 0.0.1

### Patch Changes

- Renamed core to overlay package
  ([`eacbe71`](https://github.com/getsentry/spotlight/commit/eacbe71b289703efe5b62519493049d5368297fb))
