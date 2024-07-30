# @spotlightjs/sidecar

## 1.6.1

### Patch Changes

- Fix dependency issues with sidecar ([#464](https://github.com/getsentry/spotlight/pull/464))

## 1.6.0

### Minor Changes

- Add ability to use sidecar URL in a DSN ([#452](https://github.com/getsentry/spotlight/pull/452))

- Move contextlines provider to sidecar ([#454](https://github.com/getsentry/spotlight/pull/454))

- Add 'open in editor' icon ([#462](https://github.com/getsentry/spotlight/pull/462))

## 1.5.0

### Minor Changes

- A new Vite plugin under the main `@spotlightjs/spotlight` package that automatically injects spotlight for dev mode.
  It ([#434](https://github.com/getsentry/spotlight/pull/434)) also replaces Vite's error page shown on compilation
  errors with Spotlight.

## 1.4.0

### Minor Changes

- 1. Added a DELETE /clear API route for sidecar to wipe out all data from buffer.
     ([#345](https://github.com/getsentry/spotlight/pull/345))
  2. Added a cta in overlay to clear data(only present when sentry integration is added).

## 1.3.5

### Patch Changes

- Fixed setupSidecar function to not exit the process when existing sidecar is detected.
  ([#334](https://github.com/getsentry/spotlight/pull/334))

- Added a health route for sidecar with a header to check if sidecar is already running on port or not, to prevent
  ([#325](https://github.com/getsentry/spotlight/pull/325)) unnecessary retries

## 1.3.4

### Patch Changes

- updated dockerfile to use packages/spotlight build to serve index page
  ([#311](https://github.com/getsentry/spotlight/pull/311))

## 1.3.3

### Patch Changes

- Add callback for incoming requests
  ([`b864dbd`](https://github.com/getsentry/spotlight/commit/b864dbda8007eb3a509b5045b9775140c04a519c))

## 1.3.2

### Patch Changes

- Expose shutdown and buffer clear function
  ([`fa53bd6`](https://github.com/getsentry/spotlight/commit/fa53bd621b093b60eb8aed7e464f87af8beceb9e))

## 1.3.1

### Patch Changes

- Add debug mode ([`486f94b`](https://github.com/getsentry/spotlight/commit/486f94b6050be4761a119cb74f284edc93b04fab))

## 1.3.0

### Minor Changes

- ref(sidecar): Stream endpoint returns 200 instead of 204 ([#266](https://github.com/getsentry/spotlight/pull/266))

## 1.2.0

### Minor Changes

- Make shipped HTML fullscreen
  ([`fdd14c7`](https://github.com/getsentry/spotlight/commit/fdd14c7e84172f2a0b9bc355968537e161335636))

## 1.1.1

### Patch Changes

- Fix Overlay loading path
  ([`3fd1029`](https://github.com/getsentry/spotlight/commit/3fd1029a1d16a68bae16155a10d72903b7acd2b5))

## 1.1.0

### Minor Changes

- Serve Overlay from Sidecar ([#248](https://github.com/getsentry/spotlight/pull/248))

### Patch Changes

- Fix Sidecar Multitenancy ([#248](https://github.com/getsentry/spotlight/pull/248))

## 1.0.0

### Major Changes

- meta: Bump `@spotlightjs` packages to version 1.0.0 ([#228](https://github.com/getsentry/spotlight/pull/228))

  This change sets all public `@spotlightjs` packages to major version 1.0.0. From now on, we will follow semantic
  versioning.

## 0.0.16

### Patch Changes

- feat(sidecar): Accept options object in `setupSidecar` ([#226](https://github.com/getsentry/spotlight/pull/226))

- feat(sidecar): Inject optional custom logger ([#226](https://github.com/getsentry/spotlight/pull/226))

## 0.0.15

### Patch Changes

- feat(sidecar): Support setting a custom port ([#189](https://github.com/getsentry/spotlight/pull/189))

## 0.0.14

### Patch Changes

- Move everything to dev deps
  ([`aeb507a`](https://github.com/getsentry/spotlight/commit/aeb507abc4c3ba0c988b6f158959947369061b7b))

## 0.0.13

### Patch Changes

- Rename binary to spotlight-sidecar
  ([`b841b95`](https://github.com/getsentry/spotlight/commit/b841b95dd27e5b4253b9ad94b5afc8e55501f829))

## 0.0.12

### Patch Changes

- Accept gzip/deflate encoding for incoming envelopes
  ([`f7d507e`](https://github.com/getsentry/spotlight/commit/f7d507eee12d743ed0b57b21800ee487f7076d2a))

- Remove connect function from sidecar
  ([`db73d24`](https://github.com/getsentry/spotlight/commit/db73d241bba120848732e063918afd73b34f9269))

- Add SPOTLIGHT_CAPTURE mode
  ([`6b8dd6d`](https://github.com/getsentry/spotlight/commit/6b8dd6d6852a103637beb3eecc42b7d43cc2301a))

- Only if envelope is sent validate known types
  ([`ddb36d2`](https://github.com/getsentry/spotlight/commit/ddb36d252adabb8c1c259a1a55703c39d6f3213e))

- Accept all envelopes
  ([`58a2cb3`](https://github.com/getsentry/spotlight/commit/58a2cb373d3d784983347aae4741c7b6e0b48119))

## 0.0.11

### Patch Changes

- Renamed core to overlay package
  ([`eacbe71`](https://github.com/getsentry/spotlight/commit/eacbe71b289703efe5b62519493049d5368297fb))

## 0.0.10

### Patch Changes

- fix(sidecar): Fix memory leak
  ([`e7ea41b`](https://github.com/getsentry/spotlight/commit/e7ea41bb22ebf5887aeb28e0eea6d6e69885d62c))

## 0.0.9

### Patch Changes

- Add connect function
  ([`989b5b5`](https://github.com/getsentry/spotlight/commit/989b5b55cefb62240d12f65c9cf9fe9a041f03e1))

## 0.0.8

### Patch Changes

- Add node env comment
  ([`6e60701`](https://github.com/getsentry/spotlight/commit/6e607016bf9be3fa59162b392f54837323c86bbd))

## 0.0.7

### Patch Changes

- Add binary to package.json
  ([`1ac3d88`](https://github.com/getsentry/spotlight/commit/1ac3d88a6504e54f3e0f92176ad28fa141eb65c1))

## 0.0.6

### Patch Changes

- fix(sidecar): Build with Vite, typecheck with TSC
  ([`af97107`](https://github.com/getsentry/spotlight/commit/af97107d599dbaaf0f89438e1c55be9663e18863))

## 0.0.5

### Patch Changes

- Fix version bumps in package.jsons
  ([`bded33c`](https://github.com/getsentry/spotlight/commit/bded33cfd262aa7c86e35fefd9cd46f9f922d891))

## 0.0.4

### Patch Changes

- unstale yarn lock
  ([`2c3d9d1`](https://github.com/getsentry/spotlight/commit/2c3d9d1d3c9bbc36f59ed611601b0ae196c40d8b))

## 0.0.3

### Patch Changes

- Add description to package.json ([#40](https://github.com/getsentry/spotlight/pull/40))

## 0.0.2

### Patch Changes

- Update README ([#32](https://github.com/getsentry/spotlight/pull/32))

## 0.0.1

### Patch Changes

- Initial changeset added ([#21](https://github.com/getsentry/spotlight/pull/21))
