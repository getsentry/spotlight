# @spotlightjs/sidecar

## 2.1.3

### Patch Changes

- added caching for filename based query ([#1000](https://github.com/getsentry/spotlight/pull/1000))

- Fix memory leak on filenameCache ([#1005](https://github.com/getsentry/spotlight/pull/1005))

- Added more attachment viewers ([#999](https://github.com/getsentry/spotlight/pull/999))

## 2.1.2

### Patch Changes

- Fix 404 when refreshing on a page with "/telemetry" in the path ([#973](https://github.com/getsentry/spotlight/pull/973))

## 2.1.1

### Patch Changes

- Drop min Node version requirement to v20 again ([#961](https://github.com/getsentry/spotlight/pull/961))

## 2.1.0

### Minor Changes

- Automatically recover when the upstream sidecar stops/goes away in MCP stdio proxy mode ([#938](https://github.com/getsentry/spotlight/pull/938))

  - Tries to reconnect in case it was a blip or another server just took over
  - If the reconnection fails, switches itself to be the main sidecar process

  Caveat: it does not carry over the old events, we may wanna look into this in the future

- Added support for processing attachments ([#941](https://github.com/getsentry/spotlight/pull/941))

- More attachment type support: suppresses JSON parse errors from statsd and replay_video event types and displays statsd data as text ([#946](https://github.com/getsentry/spotlight/pull/946))

### Patch Changes

- Corrected the clear button api ([#951](https://github.com/getsentry/spotlight/pull/951))

- Fix engines fields in package.json for proper `pnpx` usage ([#944](https://github.com/getsentry/spotlight/pull/944))

## 2.0.0

### Major Changes

- Make `setupSidecar` async as it should be ([#936](https://github.com/getsentry/spotlight/pull/936))

- Remove all vite-plugins as they are deprecated ([#937](https://github.com/getsentry/spotlight/pull/937))

### Minor Changes

- Add support for multiple stdio MCP servers to run, as a proxy for the existing main sidecar ([#935](https://github.com/getsentry/spotlight/pull/935))

- Adds stdio based MCP server via a `--stdio-mcp` CLI argument. Also removes the context-based message buffers to be able to achieve this as there's no context-id for the stdio transport. This feature was not used anyway. ([#933](https://github.com/getsentry/spotlight/pull/933))

  Moves all log messages to stderr as they should have been to avoid clobbering the MCP stdio transport.

### Patch Changes

- - To check all items in an envelope for errors. ([#880](https://github.com/getsentry/spotlight/pull/880))

- restructured the sidecar server and minor improvements ([#918](https://github.com/getsentry/spotlight/pull/918))

- To add a soft reset buffer when its cleared. ([#895](https://github.com/getsentry/spotlight/pull/895))

## 1.12.0

### Minor Changes

- Added MCP for spotlight ([#879](https://github.com/getsentry/spotlight/pull/879))

## 1.11.4

### Patch Changes

- Handle data capture errors, when SPOTLIGHT_CAPTURE is set, gracefully ([#803](https://github.com/getsentry/spotlight/pull/803))

## 1.11.3

### Patch Changes

- use nanosecond timestamp for captured filenames ([#776](https://github.com/getsentry/spotlight/pull/776))

- Improve DX by always showing the Spotlight URL, even if the sidecar was already running. Makes it easy to
  cmd/ctrl+click ([#748](https://github.com/getsentry/spotlight/pull/748)) and open in browser.

## 1.11.2

### Patch Changes

- Fix Astro v5 compatibility ([#706](https://github.com/getsentry/spotlight/pull/706))

  Upgraded all Astro dependencies to v5+. This required suppressing Sentry instrumentation on the sidecar when used
  programmatically (unless explicitly passed `isStandalone: true`) to prevent Spotlight spamming itself with
  transactions from the very sidecar instance that it is running.

  BREAKING: We had to bump minimum required Astro version for the Astro plugin to 4.7+ as we needed the new dev toolbar
  app APIs.

## 1.11.1

### Patch Changes

- Fix invalid semver range for source-map dependency ([#667](https://github.com/getsentry/spotlight/pull/667))

## 1.11.0

### Minor Changes

- Add base64 encoding for envelope passing ([#659](https://github.com/getsentry/spotlight/pull/659))

  This fixes the issue certain characters getting lost or changed during the implicit and forced UTF-8 encoding, namely
  certain ANSI-escape characters when we capture them as breadcrumbs. This was breaking NextJS recently.

  The mechanism is opt-in from Sidecar side and the new overlay automatically opts in to fix the issue. The new overlay
  is also capable of processing messages w/o base64 encoding so this change is both backwards and forwards compatible
  meaning a new version of overlay can work with an old sidecar and a new version of sidecar can work with an older
  overlay. That said to get the fix, both should be on the new version, opting into base64 encoding.

### Patch Changes

- Upgrades source-map dependency to avoid mappings.wasm error ([#638](https://github.com/getsentry/spotlight/pull/638))

## 1.10.0

### Minor Changes

- Add support for rich breadcrumbs ([#632](https://github.com/getsentry/spotlight/pull/632))

### Patch Changes

- Fix timeout mechanism on is sidecar running check ([#634](https://github.com/getsentry/spotlight/pull/634))

- Fix encoding related corruption on binary envelope payloads ([#631](https://github.com/getsentry/spotlight/pull/631))

## 1.9.4

### Patch Changes

- Better custom sidecar port detection in main Spotlight module
  ([#623](https://github.com/getsentry/spotlight/pull/623))

## 1.9.3

### Patch Changes

- Fix sidecar package build, export all from dist with types ([#616](https://github.com/getsentry/spotlight/pull/616))

## 1.9.2

### Patch Changes

- Fix hang at SIGINT termination ([#597](https://github.com/getsentry/spotlight/pull/597))

## 1.9.1

### Patch Changes

- No change, just to fix a broken release ([#576](https://github.com/getsentry/spotlight/pull/576))

## 1.9.0

### Minor Changes

- - Sidecar url made generic to support all sidecar server routes.
    ([#558](https://github.com/getsentry/spotlight/pull/558))
  - No use of static sidecar url.

- Create a self-contained executable for Linux, macOS, and Windows for Spotlight.
  ([#559](https://github.com/getsentry/spotlight/pull/559)) Docker images now use these binaries instead of a Node build
  in the image.

### Patch Changes

- Fix hanging when another Spotlight server is running ([#571](https://github.com/getsentry/spotlight/pull/571))

## 1.8.0

### Minor Changes

- Add CORS headers to static file server -- this allows proxying sidecar assets
  ([#519](https://github.com/getsentry/spotlight/pull/519))

## 1.7.0

### Minor Changes

- Auto-correct Sentry Browser SDK content type & fix URL matching with query string
  ([#471](https://github.com/getsentry/spotlight/pull/471))

## 1.6.2

### Patch Changes

- Allow trailing slash in DSN endpoint ([#466](https://github.com/getsentry/spotlight/pull/466))

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
