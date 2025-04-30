# @spotlightjs/astro

## 3.2.3

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.13.3

## 3.2.2

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.13.2

## 3.2.1

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.13.1

## 3.2.0

### Minor Changes

- feat: Keep profile spans collapsed ([#737](https://github.com/getsentry/spotlight/pull/737))

### Patch Changes

- fix: Null-check sentryClient.\_options ([#736](https://github.com/getsentry/spotlight/pull/736))

- Updated dependencies
  [[`3d569f30fb746d90ecabaac35d23d980360ea99c`](https://github.com/getsentry/spotlight/commit/3d569f30fb746d90ecabaac35d23d980360ea99c),
  [`d3a2f0a0fae9074802b0551f3e1662833c1423c9`](https://github.com/getsentry/spotlight/commit/d3a2f0a0fae9074802b0551f3e1662833c1423c9),
  [`d0315bc2ead9ccea722cc73c6b5fd7d9fed3f4a4`](https://github.com/getsentry/spotlight/commit/d0315bc2ead9ccea722cc73c6b5fd7d9fed3f4a4)]:
  - @spotlightjs/spotlight@2.13.0

## 3.1.0

### Minor Changes

- Make event id a link to raw envelope on envelope details page
  ([#729](https://github.com/getsentry/spotlight/pull/729))

### Patch Changes

- Fix envelope sorting and local classification ([#727](https://github.com/getsentry/spotlight/pull/727))

- Fix UI issues when we get a bare span envelope ([#726](https://github.com/getsentry/spotlight/pull/726))

- Fix span details modal resetting trace view tree state on close (for reals this time)
  ([#728](https://github.com/getsentry/spotlight/pull/728))

- Fixes detection of Sentry SDK frames in Vite projects ([#718](https://github.com/getsentry/spotlight/pull/718))

- Updated dependencies
  [[`9ca9ed1b97119757d8b1ec6de24d781aefe8b76c`](https://github.com/getsentry/spotlight/commit/9ca9ed1b97119757d8b1ec6de24d781aefe8b76c),
  [`c39cfb3622fe19ccc5df822d30d16298f254cb17`](https://github.com/getsentry/spotlight/commit/c39cfb3622fe19ccc5df822d30d16298f254cb17),
  [`f731d9171ead5aea21152f1d3bfa89e473a7272c`](https://github.com/getsentry/spotlight/commit/f731d9171ead5aea21152f1d3bfa89e473a7272c),
  [`97dfa768846c76da47521f551b1bb45c683a23d9`](https://github.com/getsentry/spotlight/commit/97dfa768846c76da47521f551b1bb45c683a23d9),
  [`79506149f545487e67cdff7eab7393c619c8afd9`](https://github.com/getsentry/spotlight/commit/79506149f545487e67cdff7eab7393c619c8afd9)]:
  - @spotlightjs/spotlight@2.12.0

## 3.0.1

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.11.1

## 3.0.0

### Major Changes

- Fix Astro v5 compatibility ([#706](https://github.com/getsentry/spotlight/pull/706))

  Upgraded all Astro dependencies to v5+. This required suppressing Sentry instrumentation on the sidecar when used
  programmatically (unless explicitly passed `isStandalone: true`) to prevent Spotlight spamming itself with
  transactions from the very sidecar instance that it is running.

  BREAKING: We had to bump minimum required Astro version for the Astro plugin to 4.7+ as we needed the new dev toolbar
  app APIs.

### Minor Changes

- # Add profile grafting into traces ([#692](https://github.com/getsentry/spotlight/pull/692))

  With this change, Spotlight can now ingest v1 profiles and graft profiling data into the trace view to fill in the
  gaps where span/trace instrumentation falls short.

  This feature is experimental.

  Breaking change for `tsconfig`: It now targets ES2023 as we needed `Array.findLastIndex()`

- Flatter tree view for deeply nested traces with 1 child at each level
  ([#686](https://github.com/getsentry/spotlight/pull/686))

### Patch Changes

- Sort envelopes from most recent to oldest ([#697](https://github.com/getsentry/spotlight/pull/697))

- Fix some typing issues in sentryDataCache ([#691](https://github.com/getsentry/spotlight/pull/691))

- Fix span details modal resetting trace view tree state on close
  ([#701](https://github.com/getsentry/spotlight/pull/701))

- Fix some profile samples were not grouped and added to trace span list for detail view
  ([#698](https://github.com/getsentry/spotlight/pull/698))

- Fix span details showing incorrect span start time ([#689](https://github.com/getsentry/spotlight/pull/689))

- Fix rare error when `score.total` is missing from `measurements`
  ([#682](https://github.com/getsentry/spotlight/pull/682))

- Make things snappy by using Map() for trace span look ups ([#690](https://github.com/getsentry/spotlight/pull/690))

- Better auto collapsing logic for large or deep span trees ([#699](https://github.com/getsentry/spotlight/pull/699))

- Unify and simplify duration calculations and representations ([#688](https://github.com/getsentry/spotlight/pull/688))

- Updated dependencies
  [[`4cde1351151520d576fa173485993f30a29a594a`](https://github.com/getsentry/spotlight/commit/4cde1351151520d576fa173485993f30a29a594a),
  [`1ffe90f973618b8775753c257d3efc7c688de522`](https://github.com/getsentry/spotlight/commit/1ffe90f973618b8775753c257d3efc7c688de522),
  [`dab431eccdeb751b0eecdd3a41bbb790011f0c52`](https://github.com/getsentry/spotlight/commit/dab431eccdeb751b0eecdd3a41bbb790011f0c52),
  [`05e03c749892af0042f3cc4e3e15b85fd5dcdaac`](https://github.com/getsentry/spotlight/commit/05e03c749892af0042f3cc4e3e15b85fd5dcdaac),
  [`18bee4d0a3c8ea7021866ed09855b3feee40c4c4`](https://github.com/getsentry/spotlight/commit/18bee4d0a3c8ea7021866ed09855b3feee40c4c4),
  [`289a040d9cdfdf1a4ca65ed0e80aadb7adc36830`](https://github.com/getsentry/spotlight/commit/289a040d9cdfdf1a4ca65ed0e80aadb7adc36830),
  [`9c498dd3e358e6337ea0d8725bb6bf1b41a66233`](https://github.com/getsentry/spotlight/commit/9c498dd3e358e6337ea0d8725bb6bf1b41a66233),
  [`52ceec528c4e293d92afc6567886b9ee9dcffc7a`](https://github.com/getsentry/spotlight/commit/52ceec528c4e293d92afc6567886b9ee9dcffc7a),
  [`002a1873dab737ffbe647dd608bb00b7bf6ab1a6`](https://github.com/getsentry/spotlight/commit/002a1873dab737ffbe647dd608bb00b7bf6ab1a6),
  [`a6dee826c983fb1671930f8187ba98e033f291ff`](https://github.com/getsentry/spotlight/commit/a6dee826c983fb1671930f8187ba98e033f291ff),
  [`e31e3da656d4c675845d4f736e93f350d6f8f687`](https://github.com/getsentry/spotlight/commit/e31e3da656d4c675845d4f736e93f350d6f8f687),
  [`0fcb37d5878568018038d237956426219bf64fc3`](https://github.com/getsentry/spotlight/commit/0fcb37d5878568018038d237956426219bf64fc3)]:
  - @spotlightjs/spotlight@2.11.0

## 2.4.3

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.10.3

## 2.4.2

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.10.2

## 2.4.1

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.10.1

## 2.4.0

### Minor Changes

- Render placeholders when missing known attributes in Sentry events
  ([#656](https://github.com/getsentry/spotlight/pull/656))

### Patch Changes

- Updated dependencies
  [[`5d8c7058300b349cd17d543874cfb810ff7db8d9`](https://github.com/getsentry/spotlight/commit/5d8c7058300b349cd17d543874cfb810ff7db8d9),
  [`cfa9cc967da8aa862f55c3880aab44f7d5b5eeb4`](https://github.com/getsentry/spotlight/commit/cfa9cc967da8aa862f55c3880aab44f7d5b5eeb4),
  [`356890c6faf4ef3d9ebf85615e3f43f34fca0439`](https://github.com/getsentry/spotlight/commit/356890c6faf4ef3d9ebf85615e3f43f34fca0439)]:
  - @spotlightjs/spotlight@2.10.0

## 2.3.0

### Minor Changes

- Add support for rich breadcrumbs ([#632](https://github.com/getsentry/spotlight/pull/632))

### Patch Changes

- Updated dependencies
  [[`09d3179ccadb61a1fbb119d3a2a8d9315921442e`](https://github.com/getsentry/spotlight/commit/09d3179ccadb61a1fbb119d3a2a8d9315921442e),
  [`319fef8422dea9425b7f230eab9b7294fbeb5a72`](https://github.com/getsentry/spotlight/commit/319fef8422dea9425b7f230eab9b7294fbeb5a72),
  [`0c2ade8e5699e855a31a603067aa575d7580894e`](https://github.com/getsentry/spotlight/commit/0c2ade8e5699e855a31a603067aa575d7580894e),
  [`12c9552909f8b54f4106e2a2f955475955c0413a`](https://github.com/getsentry/spotlight/commit/12c9552909f8b54f4106e2a2f955475955c0413a)]:
  - @spotlightjs/spotlight@2.9.0

## 2.2.2

### Patch Changes

- Updated dependencies
  [[`d9a91975334e213c59692fb087aab47799149888`](https://github.com/getsentry/spotlight/commit/d9a91975334e213c59692fb087aab47799149888)]:
  - @spotlightjs/spotlight@2.8.1

## 2.2.1

### Patch Changes

- Updated dependencies
  [[`455f6966d0602af38fd0835627d11dea03b88362`](https://github.com/getsentry/spotlight/commit/455f6966d0602af38fd0835627d11dea03b88362),
  [`4716ddeda0e52289b0f9bc9889ffcf957a69d1a8`](https://github.com/getsentry/spotlight/commit/4716ddeda0e52289b0f9bc9889ffcf957a69d1a8),
  [`6240009c99fa4699f25325e356b32dc8849e3b92`](https://github.com/getsentry/spotlight/commit/6240009c99fa4699f25325e356b32dc8849e3b92),
  [`f0bb9a98b4df7ce49c9fd73a093dc7b2005305b9`](https://github.com/getsentry/spotlight/commit/f0bb9a98b4df7ce49c9fd73a093dc7b2005305b9)]:
  - @spotlightjs/spotlight@2.8.0

## 2.2.0

### Minor Changes

- Add method name to trace list ([#599](https://github.com/getsentry/spotlight/pull/599))

### Patch Changes

- Updated dependencies
  [[`0ce5ee3206c0ce2e10a523fb3dbe6bff05ef2e01`](https://github.com/getsentry/spotlight/commit/0ce5ee3206c0ce2e10a523fb3dbe6bff05ef2e01),
  [`2e5bc8c3aad37e140be7be850ffc7c75a87f4dfe`](https://github.com/getsentry/spotlight/commit/2e5bc8c3aad37e140be7be850ffc7c75a87f4dfe),
  [`678dbf7240b7b97fe191356e1ec35d20875e132b`](https://github.com/getsentry/spotlight/commit/678dbf7240b7b97fe191356e1ec35d20875e132b),
  [`630b83b5631d366eaa7fbdd1bb8756c591a506f3`](https://github.com/getsentry/spotlight/commit/630b83b5631d366eaa7fbdd1bb8756c591a506f3)]:
  - @spotlightjs/spotlight@2.7.0

## 2.1.15

### Patch Changes

- Updated dependencies
  [[`b953ce13bb3bf9fec2ab05be6a5c63e71fa3ac75`](https://github.com/getsentry/spotlight/commit/b953ce13bb3bf9fec2ab05be6a5c63e71fa3ac75)]:
  - @spotlightjs/spotlight@2.6.3

## 2.1.14

### Patch Changes

- Updated dependencies
  [[`5fb478d63460f5439c90668576e113fff724edb4`](https://github.com/getsentry/spotlight/commit/5fb478d63460f5439c90668576e113fff724edb4),
  [`8c183d6bc5a74fd85ba941274abf94e76de458bf`](https://github.com/getsentry/spotlight/commit/8c183d6bc5a74fd85ba941274abf94e76de458bf)]:
  - @spotlightjs/spotlight@2.6.2

## 2.1.13

### Patch Changes

- No change, just to fix a broken release ([#576](https://github.com/getsentry/spotlight/pull/576))

- Updated dependencies
  [[`df760b525843e53af891626e96d8e8086bb1473f`](https://github.com/getsentry/spotlight/commit/df760b525843e53af891626e96d8e8086bb1473f)]:
  - @spotlightjs/spotlight@2.6.1

## 2.1.12

### Patch Changes

- Updated dependencies
  [[`378b5c186742cb30949e5ba6342bd799b4c82b08`](https://github.com/getsentry/spotlight/commit/378b5c186742cb30949e5ba6342bd799b4c82b08),
  [`2e4d90c369c6345b38c085cea89142647c4b6be2`](https://github.com/getsentry/spotlight/commit/2e4d90c369c6345b38c085cea89142647c4b6be2),
  [`ab5181c645bcee3ab42a4f28db4daab47b5852a5`](https://github.com/getsentry/spotlight/commit/ab5181c645bcee3ab42a4f28db4daab47b5852a5),
  [`dad649a9f716d91be2665fd43f4d09497cde84c6`](https://github.com/getsentry/spotlight/commit/dad649a9f716d91be2665fd43f4d09497cde84c6),
  [`1749cb3a06576a0d94f77f0831cd088045a762fb`](https://github.com/getsentry/spotlight/commit/1749cb3a06576a0d94f77f0831cd088045a762fb),
  [`5c0b1624bac267554d93bc81d17414159f0b9fe0`](https://github.com/getsentry/spotlight/commit/5c0b1624bac267554d93bc81d17414159f0b9fe0),
  [`c88e50edd07c56c7368ff6788bbaa938e3f9f6b8`](https://github.com/getsentry/spotlight/commit/c88e50edd07c56c7368ff6788bbaa938e3f9f6b8)]:
  - @spotlightjs/spotlight@2.6.0

## 2.1.11

### Patch Changes

- Updated dependencies
  [[`728f62310ac5ead03ba23fb393e2557b4cb944b1`](https://github.com/getsentry/spotlight/commit/728f62310ac5ead03ba23fb393e2557b4cb944b1)]:
  - @spotlightjs/spotlight@2.5.0

## 2.1.10

### Patch Changes

- Fix race condition on event processing - prevent doubling of events
  ([#528](https://github.com/getsentry/spotlight/pull/528))

- Updated dependencies
  [[`f22222717dcf2482892e1cc83c233c83ba03211d`](https://github.com/getsentry/spotlight/commit/f22222717dcf2482892e1cc83c233c83ba03211d)]:
  - @spotlightjs/spotlight@2.4.2

## 2.1.9

### Patch Changes

- Fixed infinite render loops and optimized rerenders ([#522](https://github.com/getsentry/spotlight/pull/522))

- Updated dependencies
  [[`df9cd954323648d8c22e61643520a1642b8884ca`](https://github.com/getsentry/spotlight/commit/df9cd954323648d8c22e61643520a1642b8884ca)]:
  - @spotlightjs/spotlight@2.4.1

## 2.1.8

### Patch Changes

- Updated dependencies
  [[`5b6dbba62f3cdf432723b8740c75dbee04923688`](https://github.com/getsentry/spotlight/commit/5b6dbba62f3cdf432723b8740c75dbee04923688)]:
  - @spotlightjs/spotlight@2.4.0

## 2.1.7

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/spotlight@2.3.2

## 2.1.6

### Patch Changes

- Various improvements in React code for better stability & performance
  ([#476](https://github.com/getsentry/spotlight/pull/476))

- Updated dependencies
  [[`d38c054a47820fe074ad3fd61fe5960e85e0ef49`](https://github.com/getsentry/spotlight/commit/d38c054a47820fe074ad3fd61fe5960e85e0ef49),
  [`8f42d4e6b97d3503c36447c0ba6ffa1ebea72ccf`](https://github.com/getsentry/spotlight/commit/8f42d4e6b97d3503c36447c0ba6ffa1ebea72ccf)]:
  - @spotlightjs/spotlight@2.3.1

## 2.1.5

### Patch Changes

- Updated dependencies
  [[`b7774ef2fdb924c25c6e8365a3aaf20acf926f4d`](https://github.com/getsentry/spotlight/commit/b7774ef2fdb924c25c6e8365a3aaf20acf926f4d)]:
  - @spotlightjs/spotlight@2.3.0

## 2.1.4

### Patch Changes

- Updated dependencies
  [[`f890e1b15c8c493916f4d3c68f6f2a259ae21cea`](https://github.com/getsentry/spotlight/commit/f890e1b15c8c493916f4d3c68f6f2a259ae21cea)]:
  - @spotlightjs/spotlight@2.2.2

## 2.1.3

### Patch Changes

- Fix dependency issues with sidecar ([#464](https://github.com/getsentry/spotlight/pull/464))

- Updated dependencies
  [[`9fccaae507324671a16e939d1ed4a38539750827`](https://github.com/getsentry/spotlight/commit/9fccaae507324671a16e939d1ed4a38539750827)]:
  - @spotlightjs/spotlight@2.2.1

## 2.1.2

### Patch Changes

- Updated dependencies
  [[`6cf5de875f3f8e5a6ff0ec165dbd71af3b1932f5`](https://github.com/getsentry/spotlight/commit/6cf5de875f3f8e5a6ff0ec165dbd71af3b1932f5),
  [`0a6486b14d96a0eafec27a94707e4715b9fc3583`](https://github.com/getsentry/spotlight/commit/0a6486b14d96a0eafec27a94707e4715b9fc3583),
  [`9a7357f1dedc66d030358176bee777715b09c41b`](https://github.com/getsentry/spotlight/commit/9a7357f1dedc66d030358176bee777715b09c41b),
  [`06f3070867534641dbb5c394e5513ca9781bbfa8`](https://github.com/getsentry/spotlight/commit/06f3070867534641dbb5c394e5513ca9781bbfa8),
  [`725cbb5daea8682fdf8fefb952ddce68c97c4d6f`](https://github.com/getsentry/spotlight/commit/725cbb5daea8682fdf8fefb952ddce68c97c4d6f)]:
  - @spotlightjs/spotlight@2.2.0

## 2.1.1

### Patch Changes

- Updated dependencies
  [[`407e16aedfde6698fa080a23d50cf839583d25ef`](https://github.com/getsentry/spotlight/commit/407e16aedfde6698fa080a23d50cf839583d25ef)]:
  - @spotlightjs/spotlight@2.1.1

## 2.1.0

### Minor Changes

- A new Vite plugin under the main `@spotlightjs/spotlight` package that automatically injects spotlight for dev mode.
  It ([#434](https://github.com/getsentry/spotlight/pull/434)) also replaces Vite's error page shown on compilation
  errors with Spotlight.

- 1. Altered the ssr-page vite plugin in @spotlight/astro to run spotlight overlay in fullscreen mode in ssr-error page.
     ([#364](https://github.com/getsentry/spotlight/pull/364))
  2. Closed astro erro overlay.
  3. Added a option in sentry integration to open first error encountered in spotlight automatically.

### Patch Changes

- Updated dependencies
  [[`a8c09cd8629677ab3eed4bf7000de4c7068538ee`](https://github.com/getsentry/spotlight/commit/a8c09cd8629677ab3eed4bf7000de4c7068538ee)]:
  - @spotlightjs/spotlight@2.1.0

## 2.0.0

### Major Changes

- feat: Drop Support for JS SDK <7.99.0 and add support for JS SDK 8.x
  ([`b7e5bb22a53bdb650136e01e6d0b57e4435dc279`](https://github.com/getsentry/spotlight/commit/b7e5bb22a53bdb650136e01e6d0b57e4435dc279))

  The Spotlight UI (overlay) was updated to version 2 to ensure compatibility with version 8 of Sentry's JavaScript
  SDKs.

  Here's what you need to do to update to the new major version:

  - If you're using a Sentry JavaScript SDK on your host app where the spotlight overlay is running, ensure that you use
    version `8` or `>=7.99.0` of your `@sentry/<sdk>` SDK. Older v7 versions will not work correctly anymore.
  - Good news: There are **no public API** changes! You don't need to make any changes to your code.

Head over to the [Spotlight Docs](https://spotlightjs.com/setup/migration/#updating-from-1x-to-2x) for more details!

### Minor Changes

- feat: Support versioned Sentry carrier object introduced in 8.6.0+
  ([`924fa828db2e2bc38045b2b3e6845819c37cf810`](https://github.com/getsentry/spotlight/commit/924fa828db2e2bc38045b2b3e6845819c37cf810))

### Patch Changes

- Updated dependencies
  [[`b7e5bb22a53bdb650136e01e6d0b57e4435dc279`](https://github.com/getsentry/spotlight/commit/b7e5bb22a53bdb650136e01e6d0b57e4435dc279),
  [`9f79f3b166220d8a485bda8999a4d2bf3805fedc`](https://github.com/getsentry/spotlight/commit/9f79f3b166220d8a485bda8999a4d2bf3805fedc),
  [`924fa828db2e2bc38045b2b3e6845819c37cf810`](https://github.com/getsentry/spotlight/commit/924fa828db2e2bc38045b2b3e6845819c37cf810),
  [`e80634f364f4145d51b6c6ab221b7e613123dd66`](https://github.com/getsentry/spotlight/commit/e80634f364f4145d51b6c6ab221b7e613123dd66),
  [`076d953f86dd409f2a4b3d4aa07c6b1c2b6f58e5`](https://github.com/getsentry/spotlight/commit/076d953f86dd409f2a4b3d4aa07c6b1c2b6f58e5)]:
  - @spotlightjs/overlay@2.0.0

## 2.0.0-alpha.2

### Minor Changes

- feat: Support versioned Sentry carrier object introduced in 8.6.0+
  ([#402](https://github.com/getsentry/spotlight/pull/402))

### Patch Changes

- Updated dependencies
  [[`010162a4672cae3be20379730e18826627a6f01b`](https://github.com/getsentry/spotlight/commit/010162a4672cae3be20379730e18826627a6f01b)]:
  - @spotlightjs/overlay@2.0.0-alpha.2

## 2.0.0-alpha.1

### Major Changes

- feat: Drop Support for JS SDK <7.99.0 and add support for JS SDK 8.x
  ([#386](https://github.com/getsentry/spotlight/pull/386))

  The Spotlight UI (overlay) was updated to version 2 to ensure compatibility with version 8 of Sentry's JavaScript
  SDKs.

  Here's what you need to do to update to the new major version:

  - If you're using a Sentry JavaScript SDK on your host app where the spotlight overlay is running, ensure that you use
    version `8` or `>=7.99.0` of your `@sentry/<sdk>` SDK. Older v7 versions will not work correctly anymore.
  - Good news: There are **no public API** changes! You don't need to make any changes to your code.

### Patch Changes

- Updated dependencies
  [[`eee45321402b1652af64ae48377d7b703aa418ad`](https://github.com/getsentry/spotlight/commit/eee45321402b1652af64ae48377d7b703aa418ad)]:
  - @spotlightjs/overlay@2.0.0-alpha.1

## 2.0.0-alpha.0

### Major Changes

- feat: Make Spotlight compatible with Sentry SDKs v8

## 1.0.20

### Patch Changes

- Updated dependencies
  [[`4a8c36a`](https://github.com/getsentry/spotlight/commit/4a8c36a435c3af9ac820be7ee1a6e1d94c377f8e),
  [`2e0b536`](https://github.com/getsentry/spotlight/commit/2e0b536b0b0ce3a5b92023f2c9c973bd819dd263)]:
  - @spotlightjs/overlay@1.8.3

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/overlay@2.0.0-alpha.0

## 1.0.19

### Patch Changes

- Updated dependencies
  [[`1ee2c98`](https://github.com/getsentry/spotlight/commit/1ee2c98a70569d16ab98feef2caddc18e578a114)]:
  - @spotlightjs/overlay@1.8.2

## 1.0.18

### Patch Changes

- Updated dependencies
  [[`0d5d677`](https://github.com/getsentry/spotlight/commit/0d5d677a78fecd7f5027792d211b0c18f906b8e1)]:
  - @spotlightjs/overlay@1.8.1

## 1.0.17

### Patch Changes

- Updated dependencies
  [[`dc7b649`](https://github.com/getsentry/spotlight/commit/dc7b649a40d22066799ef7df389aa1feb1e61d78),
  [`70608a5`](https://github.com/getsentry/spotlight/commit/70608a5865ce4421dbe83a78f719890d64fd8e21),
  [`28a09e9`](https://github.com/getsentry/spotlight/commit/28a09e92a53757cf96c2297b926217659cb94788)]:
  - @spotlightjs/overlay@1.8.0

## 1.0.16

### Patch Changes

- Updated dependencies
  [[`bbca69e`](https://github.com/getsentry/spotlight/commit/bbca69ebeba4892e9c944f1b778873b8b7b252a0),
  [`bbca69e`](https://github.com/getsentry/spotlight/commit/bbca69ebeba4892e9c944f1b778873b8b7b252a0),
  [`2d37041`](https://github.com/getsentry/spotlight/commit/2d37041d621691e066712838ae55caa8bc696671),
  [`0a88e09`](https://github.com/getsentry/spotlight/commit/0a88e09eb577bed11d4a61ef402cf3748d15fe2e),
  [`1560645`](https://github.com/getsentry/spotlight/commit/1560645a96d38401fc23aa289992950dfb8d8a8e),
  [`819f153`](https://github.com/getsentry/spotlight/commit/819f153a3cd6f4dd947ff612e5ca2920e4ce710c)]:
  - @spotlightjs/overlay@1.7.0

## 1.0.15

### Patch Changes

- Updated dependencies
  [[`c2cf7a8`](https://github.com/getsentry/spotlight/commit/c2cf7a88ad36b2e4563dee99b7fcee10d3380b41),
  [`facce9d`](https://github.com/getsentry/spotlight/commit/facce9d979ae2f1981e75c0a2cc86d00ad6f5b87)]:
  - @spotlightjs/overlay@1.6.0
  - @spotlightjs/sidecar@1.4.0

## 1.0.14

### Patch Changes

- Updated dependencies
  [[`8983a8f`](https://github.com/getsentry/spotlight/commit/8983a8fdd58d383f3c610c9c235631c578902d13)]:
  - @spotlightjs/overlay@1.5.0

## 1.0.13

### Patch Changes

- Updated dependencies
  [[`c47c1d6`](https://github.com/getsentry/spotlight/commit/c47c1d6857c7b9b0282f65317b53616997218281)]:
  - @spotlightjs/overlay@1.4.1

## 1.0.12

### Patch Changes

- Updated dependencies
  [[`908cc08`](https://github.com/getsentry/spotlight/commit/908cc083f981c81b68a11109545d183184bbdd06),
  [`92d5962`](https://github.com/getsentry/spotlight/commit/92d5962b77b0a3419dd729452af40d9c40a30ecc),
  [`080b607`](https://github.com/getsentry/spotlight/commit/080b607bf8a3b4419b54170b137776497043836a)]:
  - @spotlightjs/overlay@1.4.0

## 1.0.11

### Patch Changes

- Updated dependencies
  [[`996754b`](https://github.com/getsentry/spotlight/commit/996754bc915572165cabcf66337afd74e64f7eb8),
  [`5f13735`](https://github.com/getsentry/spotlight/commit/5f13735699b92f07360d48100a0aee37af26feb6),
  [`5691e9c`](https://github.com/getsentry/spotlight/commit/5691e9cc4d7f2be537e5c9de82a3540a8aa8fbd9),
  [`3eb0afd`](https://github.com/getsentry/spotlight/commit/3eb0afd9934ea16c99603a749db60352cc426908),
  [`52a6eab`](https://github.com/getsentry/spotlight/commit/52a6eab5f3030e9dcd781f5dd6afb80f15cb46db)]:
  - @spotlightjs/overlay@1.3.1
  - @spotlightjs/sidecar@1.3.5

## 1.0.10

### Patch Changes

- Updated dependencies
  [[`f77819a`](https://github.com/getsentry/spotlight/commit/f77819af59ff6c369795ae190b0b3630454f0a00),
  [`f5a555d`](https://github.com/getsentry/spotlight/commit/f5a555dfc29e752c02cf856d75a92348d1e5920d),
  [`60b1b69`](https://github.com/getsentry/spotlight/commit/60b1b69293a15d56a3ecac5127d66e57b2640d6c),
  [`43f3196`](https://github.com/getsentry/spotlight/commit/43f3196163851f828e4bfe151a34af2ad2c21798)]:
  - @spotlightjs/overlay@1.3.0
  - @spotlightjs/sidecar@1.3.4

## 1.0.9

### Patch Changes

- Updated dependencies
  [[`b864dbd`](https://github.com/getsentry/spotlight/commit/b864dbda8007eb3a509b5045b9775140c04a519c),
  [`14eadb9`](https://github.com/getsentry/spotlight/commit/14eadb97f34d3430e201cc3a29170bf22f02e4ff),
  [`fed3835`](https://github.com/getsentry/spotlight/commit/fed3835e989b10b82d52a079be15738bf5527c61)]:
  - @spotlightjs/sidecar@1.3.3
  - @spotlightjs/overlay@1.2.3

## 1.0.8

### Patch Changes

- Updated dependencies
  [[`66f7470`](https://github.com/getsentry/spotlight/commit/66f74705aca014c89cdd6ebc587f79eac78b0df5)]:
  - @spotlightjs/overlay@1.2.2

## 1.0.7

### Patch Changes

- Fix issue on Windows caused by importing arbitrary paths ([#276](https://github.com/getsentry/spotlight/pull/276))

- Updated dependencies
  [[`fa53bd6`](https://github.com/getsentry/spotlight/commit/fa53bd621b093b60eb8aed7e464f87af8beceb9e),
  [`f15e006`](https://github.com/getsentry/spotlight/commit/f15e0068a64459cf8078c4369ca4108152c09b27),
  [`86e1cb4`](https://github.com/getsentry/spotlight/commit/86e1cb43f19c866cdad31c354496181a8ed8bbbf)]:
  - @spotlightjs/sidecar@1.3.2
  - @spotlightjs/overlay@1.2.1

## 1.0.6

### Patch Changes

- Updated dependencies
  [[`486f94b`](https://github.com/getsentry/spotlight/commit/486f94b6050be4761a119cb74f284edc93b04fab)]:
  - @spotlightjs/sidecar@1.3.1

## 1.0.5

### Patch Changes

- Updated dependencies
  [[`0de3490`](https://github.com/getsentry/spotlight/commit/0de3490575f7d45f124ffe24fbe7b28ffe4cae2a)]:
  - @spotlightjs/sidecar@1.3.0

## 1.0.4

### Patch Changes

- Updated dependencies
  [[`eef528a`](https://github.com/getsentry/spotlight/commit/eef528a2b123b66fc299ff90badf147ddb53a2fc),
  [`0c2a229`](https://github.com/getsentry/spotlight/commit/0c2a229f53f356b6413fded3352f108c0d955333)]:
  - @spotlightjs/overlay@1.2.0

## 1.0.3

### Patch Changes

- Updated dependencies
  [[`fdd14c7`](https://github.com/getsentry/spotlight/commit/fdd14c7e84172f2a0b9bc355968537e161335636)]:
  - @spotlightjs/overlay@1.1.0
  - @spotlightjs/sidecar@1.2.0

## 1.0.2

### Patch Changes

- Updated dependencies
  [[`3fd1029`](https://github.com/getsentry/spotlight/commit/3fd1029a1d16a68bae16155a10d72903b7acd2b5)]:
  - @spotlightjs/sidecar@1.1.1

## 1.0.1

### Patch Changes

- Updated dependencies
  [[`237107e`](https://github.com/getsentry/spotlight/commit/237107e9b6d3b05ce505f6673fddb4d35ea57456),
  [`bfe997f`](https://github.com/getsentry/spotlight/commit/bfe997f4888f4afdc206146cf4cb66f195645993),
  [`237107e`](https://github.com/getsentry/spotlight/commit/237107e9b6d3b05ce505f6673fddb4d35ea57456)]:
  - @spotlightjs/sidecar@1.1.0
  - @spotlightjs/overlay@1.0.1

## 1.0.0

### Major Changes

- meta: Bump `@spotlightjs` packages to version 1.0.0 ([#228](https://github.com/getsentry/spotlight/pull/228))

  This change sets all public `@spotlightjs` packages to major version 1.0.0. From now on, we will follow semantic
  versioning.

### Patch Changes

- Updated dependencies
  [[`240e6b8`](https://github.com/getsentry/spotlight/commit/240e6b823e1e5dc72501f70f9535c08848d35b83),
  [`e18fb33`](https://github.com/getsentry/spotlight/commit/e18fb33de66f2bd9d549795b8f96d6e71b9214d6)]:
  - @spotlightjs/overlay@1.0.0
  - @spotlightjs/sidecar@1.0.0

## 0.0.26

### Patch Changes

- fix(astro): Adjust dev toolbar check after Astro 4.0 stable release
  ([#229](https://github.com/getsentry/spotlight/pull/229))

- Add guard if Sentry SDK is not there
  ([`7ba3809`](https://github.com/getsentry/spotlight/commit/7ba38099c347619ad36dc46ce2c24f77112303be))

## 0.0.25

### Patch Changes

- feat(astro): Use Astro integration logger instead of default logger
  ([#226](https://github.com/getsentry/spotlight/pull/226))

- ref(astro): Check for Astro 4 `config.devToolbar` in Spotlight integration
  ([#212](https://github.com/getsentry/spotlight/pull/212))

- Updated dependencies
  [[`d3d1770`](https://github.com/getsentry/spotlight/commit/d3d1770e450852c9cadaa279028084e9494cf657),
  [`7f5b581`](https://github.com/getsentry/spotlight/commit/7f5b581a8e4599c6d42d485046399dc73f59f579),
  [`129a3d4`](https://github.com/getsentry/spotlight/commit/129a3d4abdbcbe6c17007e352ee9e7d883febf25),
  [`129a3d4`](https://github.com/getsentry/spotlight/commit/129a3d4abdbcbe6c17007e352ee9e7d883febf25),
  [`688b07f`](https://github.com/getsentry/spotlight/commit/688b07ff0ccaee8b8aed71a856c4382906485f79),
  [`0fdd4c3`](https://github.com/getsentry/spotlight/commit/0fdd4c3dc106c806037c1c419486f585d6f97e2d)]:
  - @spotlightjs/overlay@0.0.22
  - @spotlightjs/sidecar@0.0.16

## 0.0.24

### Patch Changes

- Updated dependencies
  [[`766e7d5`](https://github.com/getsentry/spotlight/commit/766e7d5ae8002e680e8d8b15db35a4e5b0519e55),
  [`766e7d5`](https://github.com/getsentry/spotlight/commit/766e7d5ae8002e680e8d8b15db35a4e5b0519e55),
  [`218be1c`](https://github.com/getsentry/spotlight/commit/218be1c252fd782437467b9abd9b6e117a9818b5),
  [`e9e9839`](https://github.com/getsentry/spotlight/commit/e9e9839583f8e653362b140c549960f911053a98)]:
  - @spotlightjs/overlay@0.0.21

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`98847d2`](https://github.com/getsentry/spotlight/commit/98847d21398a4115e5e0beacc3e9e4040c6165d1),
  [`5923ddc`](https://github.com/getsentry/spotlight/commit/5923ddc2f253a52c3bdb8302603fa6970b044fa2),
  [`d02b2ca`](https://github.com/getsentry/spotlight/commit/d02b2caf423955b19fcea447efdc2682a4167ba7),
  [`3c8a410`](https://github.com/getsentry/spotlight/commit/3c8a410ee1c1396247b8325364948d1998276279)]:
  - @spotlightjs/overlay@0.0.20
  - @spotlightjs/sidecar@0.0.15

## 0.0.22

### Patch Changes

- Move everything to dev deps
  ([`aeb507a`](https://github.com/getsentry/spotlight/commit/aeb507abc4c3ba0c988b6f158959947369061b7b))

- Updated dependencies
  [[`aeb507a`](https://github.com/getsentry/spotlight/commit/aeb507abc4c3ba0c988b6f158959947369061b7b)]:
  - @spotlightjs/overlay@0.0.19
  - @spotlightjs/sidecar@0.0.14

## 0.0.21

### Patch Changes

- chore(astro): Include Astro 4.0.0 preview versions in peer dependency range
  ([#166](https://github.com/getsentry/spotlight/pull/166))

- feat(core): Add support for custom sidecar URL in client Sentry integration
  ([#160](https://github.com/getsentry/spotlight/pull/160))

- feat(astro): Add custom `sidecarUrl` option ([#160](https://github.com/getsentry/spotlight/pull/160))

- ref(astro): Use Spotlight integration on server-side instead of custom code
  ([#155](https://github.com/getsentry/spotlight/pull/155))

- feat(astro): Toggle notification dot when receving a severe event
  ([#162](https://github.com/getsentry/spotlight/pull/162))

- Updated dependencies
  [[`d9c8ed0`](https://github.com/getsentry/spotlight/commit/d9c8ed0fbec2e015137758026a3b5eb0f4d874ba),
  [`71b31ef`](https://github.com/getsentry/spotlight/commit/71b31eff159d8ce36035a3c7b2926c154e0e6ddd),
  [`3fd22af`](https://github.com/getsentry/spotlight/commit/3fd22af0eb2ddc8ef7d10526bcfe45ab6cd25266),
  [`b841b95`](https://github.com/getsentry/spotlight/commit/b841b95dd27e5b4253b9ad94b5afc8e55501f829)]:
  - @spotlightjs/overlay@0.0.18
  - @spotlightjs/sidecar@0.0.13

## 0.0.20

### Patch Changes

- ref(astro): Add `astro@>=3.4.0` as a peer dependency ([#151](https://github.com/getsentry/spotlight/pull/151))

- Only keep Sentry as Default integration
  ([`3b2f664`](https://github.com/getsentry/spotlight/commit/3b2f66441dc10da214e0326c7b6ffa4f4257ab79))

- Don't make console/viteInspect default for Astro
  ([`8ecab1d`](https://github.com/getsentry/spotlight/commit/8ecab1dbc0431b7b9c8636dec27974e0e1fe2b02))

- Show Spotlight button if dev overlay is not enabled
  ([`5eedd2d`](https://github.com/getsentry/spotlight/commit/5eedd2d1bfce2750475936c0e8a9064392342cf3))

- Updated dependencies
  [[`00c86f1`](https://github.com/getsentry/spotlight/commit/00c86f1b574450ab1a0f62861a688965325699e7),
  [`922f092`](https://github.com/getsentry/spotlight/commit/922f092a45bad917ef5b915c4933f90bfc1e4bf2),
  [`f7d507e`](https://github.com/getsentry/spotlight/commit/f7d507eee12d743ed0b57b21800ee487f7076d2a),
  [`db73d24`](https://github.com/getsentry/spotlight/commit/db73d241bba120848732e063918afd73b34f9269),
  [`6b8dd6d`](https://github.com/getsentry/spotlight/commit/6b8dd6d6852a103637beb3eecc42b7d43cc2301a),
  [`ddb36d2`](https://github.com/getsentry/spotlight/commit/ddb36d252adabb8c1c259a1a55703c39d6f3213e),
  [`58a2cb3`](https://github.com/getsentry/spotlight/commit/58a2cb373d3d784983347aae4741c7b6e0b48119)]:
  - @spotlightjs/overlay@0.0.17
  - @spotlightjs/sidecar@0.0.12

## 0.0.19

### Patch Changes

- Renamed core to overlay package
  ([`eacbe71`](https://github.com/getsentry/spotlight/commit/eacbe71b289703efe5b62519493049d5368297fb))

- Updated dependencies
  [[`eacbe71`](https://github.com/getsentry/spotlight/commit/eacbe71b289703efe5b62519493049d5368297fb)]:
  - @spotlightjs/overlay@0.0.16
  - @spotlightjs/sidecar@0.0.11

## 0.0.18

### Patch Changes

- Add debug flag to Spotlight
  ([`9f9370f`](https://github.com/getsentry/spotlight/commit/9f9370f71c3d9f84fecc9fa3b890f9ccc872a766))

- Updated dependencies
  [[`9f9370f`](https://github.com/getsentry/spotlight/commit/9f9370f71c3d9f84fecc9fa3b890f9ccc872a766),
  [`d90c89c`](https://github.com/getsentry/spotlight/commit/d90c89ca6a9e86f33a4eaf4dbd6a160a4354cc3c)]:
  - @spotlightjs/core@0.0.15

## 0.0.17

### Patch Changes

- Updated dependencies
  [[`9f3bfe9`](https://github.com/getsentry/spotlight/commit/9f3bfe97bbbef260d6fa8c4d11ac0a6c40d0544a)]:
  - @spotlightjs/core@0.0.14

## 0.0.16

### Patch Changes

- Updated dependencies
  [[`e7ea41b`](https://github.com/getsentry/spotlight/commit/e7ea41bb22ebf5887aeb28e0eea6d6e69885d62c)]:
  - @spotlightjs/sidecar@0.0.10

## 0.0.15

### Patch Changes

- Updated dependencies
  [[`8b3e1e8`](https://github.com/getsentry/spotlight/commit/8b3e1e895e190ef0bd8ebc81bb6761d57c852336)]:
  - @spotlightjs/core@0.0.13

## 0.0.14

### Patch Changes

- Updated dependencies
  [[`3620c86`](https://github.com/getsentry/spotlight/commit/3620c86a0e98605f74f722b5ce769c8fced3dba9)]:
  - @spotlightjs/core@0.0.12

## 0.0.13

### Patch Changes

- Updated dependencies
  [[`76721fd`](https://github.com/getsentry/spotlight/commit/76721fdd0d0f11e4b8412f4c6639ca8fa06ac535)]:
  - @spotlightjs/core@0.0.11

## 0.0.12

### Patch Changes

- ref(astro): Guard requests and parsing in Vite Symbolication plugin
  ([#97](https://github.com/getsentry/spotlight/pull/97))

- Updated dependencies
  [[`e96a5c6`](https://github.com/getsentry/spotlight/commit/e96a5c6744ef59d79c6ed7164c9c8f6fe82d9aab),
  [`989b5b5`](https://github.com/getsentry/spotlight/commit/989b5b55cefb62240d12f65c9cf9fe9a041f03e1),
  [`9f8d37a`](https://github.com/getsentry/spotlight/commit/9f8d37a38f8fee28c035a87766c065e2a59351eb)]:
  - @spotlightjs/core@0.0.10
  - @spotlightjs/sidecar@0.0.9

## 0.0.11

### Patch Changes

- Updated dependencies
  [[`6e60701`](https://github.com/getsentry/spotlight/commit/6e607016bf9be3fa59162b392f54837323c86bbd)]:
  - @spotlightjs/sidecar@0.0.8

## 0.0.10

### Patch Changes

- Updated dependencies
  [[`1ac3d88`](https://github.com/getsentry/spotlight/commit/1ac3d88a6504e54f3e0f92176ad28fa141eb65c1)]:
  - @spotlightjs/sidecar@0.0.7

## 0.0.9

### Patch Changes

- fix(astro): Dynamically import stacktrace symbolification plugin to avoid client side error
  ([`33d2a0a`](https://github.com/getsentry/spotlight/commit/33d2a0a2ed8705d16e83e9fe5e8f1cdeb06d7fe3))

## 0.0.8

### Patch Changes

- fix(astro): Fix type in package.json keywords ([#66](https://github.com/getsentry/spotlight/pull/66))

## 0.0.7

### Patch Changes

- feat(astro): Add dev mode sourcemaps resolver Vite plugin ([#64](https://github.com/getsentry/spotlight/pull/64))

- Updated dependencies
  [[`9ac3749`](https://github.com/getsentry/spotlight/commit/9ac374983cc6309e5b2e564d9a11f04305385bc9),
  [`af97107`](https://github.com/getsentry/spotlight/commit/af97107d599dbaaf0f89438e1c55be9663e18863)]:
  - @spotlightjs/core@0.0.9
  - @spotlightjs/sidecar@0.0.6

## 0.0.6

### Patch Changes

- feat(astro): Show Spotlight in Server Error Pages
  ([`7606b96`](https://github.com/getsentry/spotlight/commit/7606b96080c64bfedac480bc7ab30278c69e7eca))

- Updated dependencies
  [[`60e3495`](https://github.com/getsentry/spotlight/commit/60e349537f3453d20d9b2d52d9ae98f46b4e338f),
  [`7606b96`](https://github.com/getsentry/spotlight/commit/7606b96080c64bfedac480bc7ab30278c69e7eca),
  [`7606b96`](https://github.com/getsentry/spotlight/commit/7606b96080c64bfedac480bc7ab30278c69e7eca)]:
  - @spotlightjs/core@0.0.8

## 0.0.5

### Patch Changes

- fix(astro): Add package.json entries for `astro add` compatiblity
  ([`d78de7d`](https://github.com/getsentry/spotlight/commit/d78de7dae5d384d31710e6f8f774a2f202e24905))

## 0.0.4

### Patch Changes

- fix(astro): Correctly reset toolbar button state ([#49](https://github.com/getsentry/spotlight/pull/49))

- Re-export core exports from astro package ([#47](https://github.com/getsentry/spotlight/pull/47))

- Updated dependencies
  [[`8c485ba`](https://github.com/getsentry/spotlight/commit/8c485ba0e9fad2f91e853f571b10e9956494b2e5)]:
  - @spotlightjs/core@0.0.7

## 0.0.3

### Patch Changes

- Fix version bumps in package.jsons
  ([`bded33c`](https://github.com/getsentry/spotlight/commit/bded33cfd262aa7c86e35fefd9cd46f9f922d891))

- Updated dependencies
  [[`bded33c`](https://github.com/getsentry/spotlight/commit/bded33cfd262aa7c86e35fefd9cd46f9f922d891)]:
  - @spotlightjs/core@0.0.6
  - @spotlightjs/sidecar@0.0.5

## 0.0.2

### Patch Changes

- unstale yarn lock
  ([`2c3d9d1`](https://github.com/getsentry/spotlight/commit/2c3d9d1d3c9bbc36f59ed611601b0ae196c40d8b))

- Updated dependencies
  [[`2c3d9d1`](https://github.com/getsentry/spotlight/commit/2c3d9d1d3c9bbc36f59ed611601b0ae196c40d8b)]:
  - @spotlightjs/core@0.0.5
  - @spotlightjs/sidecar@0.0.4

## 0.0.1

### Patch Changes

- Add astro package ([#40](https://github.com/getsentry/spotlight/pull/40))

- Updated dependencies
  [[`6b40ed5`](https://github.com/getsentry/spotlight/commit/6b40ed578d81a989924485c2ec06b69846cb602d),
  [`a3733b1`](https://github.com/getsentry/spotlight/commit/a3733b1eb74f089ea31990b286e75f4b50b2ae99),
  [`6b40ed5`](https://github.com/getsentry/spotlight/commit/6b40ed578d81a989924485c2ec06b69846cb602d)]:
  - @spotlightjs/core@0.0.4
  - @spotlightjs/sidecar@0.0.3
