# @spotlightjs/spotlight

## 2.3.2-next.1

### Patch Changes

- Updated dependencies
  [[`0ec320d1259c85e3505d6a80f88dc41d0f567d9e`](https://github.com/getsentry/spotlight/commit/0ec320d1259c85e3505d6a80f88dc41d0f567d9e)]:
  - @spotlightjs/overlay@2.4.0-next.1

## 2.3.2-next.0

### Patch Changes

- Updated dependencies
  [[`87ba9ff9bd3e2634c599e123ee2fd11c26ba5ab6`](https://github.com/getsentry/spotlight/commit/87ba9ff9bd3e2634c599e123ee2fd11c26ba5ab6)]:
  - @spotlightjs/overlay@2.4.0-next.0

## 2.3.1

### Patch Changes

- Overhaul React code for multiple fixes and performance improvements
  ([#473](https://github.com/getsentry/spotlight/pull/473))

- Various improvements in React code for better stability & performance
  ([#476](https://github.com/getsentry/spotlight/pull/476))

- Updated dependencies
  [[`d38c054a47820fe074ad3fd61fe5960e85e0ef49`](https://github.com/getsentry/spotlight/commit/d38c054a47820fe074ad3fd61fe5960e85e0ef49),
  [`12ac07d7e270a48fee308e6d89495417bc06f943`](https://github.com/getsentry/spotlight/commit/12ac07d7e270a48fee308e6d89495417bc06f943),
  [`8f42d4e6b97d3503c36447c0ba6ffa1ebea72ccf`](https://github.com/getsentry/spotlight/commit/8f42d4e6b97d3503c36447c0ba6ffa1ebea72ccf)]:
  - @spotlightjs/overlay@2.3.0

## 2.3.0

### Minor Changes

- Add `#debug` flag to standalone Spotlight web UI ([#469](https://github.com/getsentry/spotlight/pull/469))

### Patch Changes

- Updated dependencies
  [[`0f10d81d60bde5753921094c7f7d7c5aa71acbaf`](https://github.com/getsentry/spotlight/commit/0f10d81d60bde5753921094c7f7d7c5aa71acbaf),
  [`7837149f0ce2de84a84eb1e0df7c6e4f317741d0`](https://github.com/getsentry/spotlight/commit/7837149f0ce2de84a84eb1e0df7c6e4f317741d0)]:
  - @spotlightjs/overlay@2.2.1
  - @spotlightjs/sidecar@1.7.0

## 2.2.2

### Patch Changes

- Allow trailing slash in DSN endpoint ([#466](https://github.com/getsentry/spotlight/pull/466))

- Updated dependencies
  [[`f890e1b15c8c493916f4d3c68f6f2a259ae21cea`](https://github.com/getsentry/spotlight/commit/f890e1b15c8c493916f4d3c68f6f2a259ae21cea)]:
  - @spotlightjs/sidecar@1.6.2
  - @spotlightjs/overlay@2.2.0

## 2.2.1

### Patch Changes

- Fix dependency issues with sidecar ([#464](https://github.com/getsentry/spotlight/pull/464))

- Updated dependencies
  [[`9fccaae507324671a16e939d1ed4a38539750827`](https://github.com/getsentry/spotlight/commit/9fccaae507324671a16e939d1ed4a38539750827)]:
  - @spotlightjs/sidecar@1.6.1
  - @spotlightjs/overlay@2.2.0

## 2.2.0

### Minor Changes

- Add ability to use sidecar URL in a DSN ([#452](https://github.com/getsentry/spotlight/pull/452))

- Move contextlines provider to sidecar ([#454](https://github.com/getsentry/spotlight/pull/454))

- Add 'open in editor' icon ([#462](https://github.com/getsentry/spotlight/pull/462))

### Patch Changes

- Fix `npx @spotlightjs/spotlight` not running standalone overlay
  ([#457](https://github.com/getsentry/spotlight/pull/457))

- Fix incompatibility between Spotlight and Storybook's bundling.
  ([#420](https://github.com/getsentry/spotlight/pull/420))

- Updated dependencies
  [[`0a6486b14d96a0eafec27a94707e4715b9fc3583`](https://github.com/getsentry/spotlight/commit/0a6486b14d96a0eafec27a94707e4715b9fc3583),
  [`9a7357f1dedc66d030358176bee777715b09c41b`](https://github.com/getsentry/spotlight/commit/9a7357f1dedc66d030358176bee777715b09c41b),
  [`06f3070867534641dbb5c394e5513ca9781bbfa8`](https://github.com/getsentry/spotlight/commit/06f3070867534641dbb5c394e5513ca9781bbfa8),
  [`725cbb5daea8682fdf8fefb952ddce68c97c4d6f`](https://github.com/getsentry/spotlight/commit/725cbb5daea8682fdf8fefb952ddce68c97c4d6f)]:
  - @spotlightjs/sidecar@1.6.0
  - @spotlightjs/overlay@2.2.0

## 2.1.1

### Patch Changes

- Fix TypeScript type locations ([#448](https://github.com/getsentry/spotlight/pull/448))

## 2.1.0

### Minor Changes

- A new Vite plugin under the main `@spotlightjs/spotlight` package that automatically injects spotlight for dev mode.
  It ([#434](https://github.com/getsentry/spotlight/pull/434)) also replaces Vite's error page shown on compilation
  errors with Spotlight.

### Patch Changes

- Updated dependencies
  [[`01321f8824ae133dc02a1d829c25952c884bf631`](https://github.com/getsentry/spotlight/commit/01321f8824ae133dc02a1d829c25952c884bf631),
  [`a8c09cd8629677ab3eed4bf7000de4c7068538ee`](https://github.com/getsentry/spotlight/commit/a8c09cd8629677ab3eed4bf7000de4c7068538ee),
  [`3792a5e742b3888a980a0b865fd23be941809040`](https://github.com/getsentry/spotlight/commit/3792a5e742b3888a980a0b865fd23be941809040),
  [`b5249aa761c783739543dc7bf27cdd8d0fe8cebe`](https://github.com/getsentry/spotlight/commit/b5249aa761c783739543dc7bf27cdd8d0fe8cebe),
  [`1c7896e02a2b81715c4e5c47cbb2fd6145868ab1`](https://github.com/getsentry/spotlight/commit/1c7896e02a2b81715c4e5c47cbb2fd6145868ab1),
  [`41d90455fa94df0a01e93fd90574974dfca96764`](https://github.com/getsentry/spotlight/commit/41d90455fa94df0a01e93fd90574974dfca96764)]:
  - @spotlightjs/overlay@2.1.0
  - @spotlightjs/sidecar@1.5.0

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

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/overlay@2.0.0-alpha.0

## 1.2.17

### Patch Changes

- Updated dependencies
  [[`4a8c36a`](https://github.com/getsentry/spotlight/commit/4a8c36a435c3af9ac820be7ee1a6e1d94c377f8e),
  [`2e0b536`](https://github.com/getsentry/spotlight/commit/2e0b536b0b0ce3a5b92023f2c9c973bd819dd263)]:
  - @spotlightjs/overlay@1.8.3

## 1.2.16

### Patch Changes

- Updated dependencies
  [[`1ee2c98`](https://github.com/getsentry/spotlight/commit/1ee2c98a70569d16ab98feef2caddc18e578a114)]:
  - @spotlightjs/overlay@1.8.2

## 1.2.15

### Patch Changes

- Updated dependencies
  [[`0d5d677`](https://github.com/getsentry/spotlight/commit/0d5d677a78fecd7f5027792d211b0c18f906b8e1)]:
  - @spotlightjs/overlay@1.8.1

## 1.2.14

### Patch Changes

- Updated dependencies
  [[`dc7b649`](https://github.com/getsentry/spotlight/commit/dc7b649a40d22066799ef7df389aa1feb1e61d78),
  [`70608a5`](https://github.com/getsentry/spotlight/commit/70608a5865ce4421dbe83a78f719890d64fd8e21),
  [`28a09e9`](https://github.com/getsentry/spotlight/commit/28a09e92a53757cf96c2297b926217659cb94788)]:
  - @spotlightjs/overlay@1.8.0

## 1.2.13

### Patch Changes

- Updated dependencies
  [[`bbca69e`](https://github.com/getsentry/spotlight/commit/bbca69ebeba4892e9c944f1b778873b8b7b252a0),
  [`bbca69e`](https://github.com/getsentry/spotlight/commit/bbca69ebeba4892e9c944f1b778873b8b7b252a0),
  [`2d37041`](https://github.com/getsentry/spotlight/commit/2d37041d621691e066712838ae55caa8bc696671),
  [`0a88e09`](https://github.com/getsentry/spotlight/commit/0a88e09eb577bed11d4a61ef402cf3748d15fe2e),
  [`1560645`](https://github.com/getsentry/spotlight/commit/1560645a96d38401fc23aa289992950dfb8d8a8e),
  [`819f153`](https://github.com/getsentry/spotlight/commit/819f153a3cd6f4dd947ff612e5ca2920e4ce710c)]:
  - @spotlightjs/overlay@1.7.0

## 1.2.12

### Patch Changes

- Updated dependencies
  [[`c2cf7a8`](https://github.com/getsentry/spotlight/commit/c2cf7a88ad36b2e4563dee99b7fcee10d3380b41),
  [`facce9d`](https://github.com/getsentry/spotlight/commit/facce9d979ae2f1981e75c0a2cc86d00ad6f5b87)]:
  - @spotlightjs/overlay@1.6.0
  - @spotlightjs/sidecar@1.4.0

## 1.2.11

### Patch Changes

- Updated dependencies
  [[`8983a8f`](https://github.com/getsentry/spotlight/commit/8983a8fdd58d383f3c610c9c235631c578902d13)]:
  - @spotlightjs/overlay@1.5.0

## 1.2.10

### Patch Changes

- Updated dependencies
  [[`c47c1d6`](https://github.com/getsentry/spotlight/commit/c47c1d6857c7b9b0282f65317b53616997218281)]:
  - @spotlightjs/overlay@1.4.1

## 1.2.9

### Patch Changes

- Updated dependencies
  [[`908cc08`](https://github.com/getsentry/spotlight/commit/908cc083f981c81b68a11109545d183184bbdd06),
  [`92d5962`](https://github.com/getsentry/spotlight/commit/92d5962b77b0a3419dd729452af40d9c40a30ecc),
  [`080b607`](https://github.com/getsentry/spotlight/commit/080b607bf8a3b4419b54170b137776497043836a)]:
  - @spotlightjs/overlay@1.4.0

## 1.2.8

### Patch Changes

- Updated dependencies
  [[`996754b`](https://github.com/getsentry/spotlight/commit/996754bc915572165cabcf66337afd74e64f7eb8),
  [`5f13735`](https://github.com/getsentry/spotlight/commit/5f13735699b92f07360d48100a0aee37af26feb6),
  [`5691e9c`](https://github.com/getsentry/spotlight/commit/5691e9cc4d7f2be537e5c9de82a3540a8aa8fbd9),
  [`3eb0afd`](https://github.com/getsentry/spotlight/commit/3eb0afd9934ea16c99603a749db60352cc426908),
  [`52a6eab`](https://github.com/getsentry/spotlight/commit/52a6eab5f3030e9dcd781f5dd6afb80f15cb46db)]:
  - @spotlightjs/overlay@1.3.1
  - @spotlightjs/sidecar@1.3.5

## 1.2.7

### Patch Changes

- updated dockerfile to use packages/spotlight build to serve index page
  ([#311](https://github.com/getsentry/spotlight/pull/311))

- Updated dependencies
  [[`f77819a`](https://github.com/getsentry/spotlight/commit/f77819af59ff6c369795ae190b0b3630454f0a00),
  [`f5a555d`](https://github.com/getsentry/spotlight/commit/f5a555dfc29e752c02cf856d75a92348d1e5920d),
  [`60b1b69`](https://github.com/getsentry/spotlight/commit/60b1b69293a15d56a3ecac5127d66e57b2640d6c),
  [`43f3196`](https://github.com/getsentry/spotlight/commit/43f3196163851f828e4bfe151a34af2ad2c21798)]:
  - @spotlightjs/overlay@1.3.0
  - @spotlightjs/sidecar@1.3.4

## 1.2.6

### Patch Changes

- Updated dependencies
  [[`b864dbd`](https://github.com/getsentry/spotlight/commit/b864dbda8007eb3a509b5045b9775140c04a519c),
  [`14eadb9`](https://github.com/getsentry/spotlight/commit/14eadb97f34d3430e201cc3a29170bf22f02e4ff),
  [`fed3835`](https://github.com/getsentry/spotlight/commit/fed3835e989b10b82d52a079be15738bf5527c61)]:
  - @spotlightjs/sidecar@1.3.3
  - @spotlightjs/overlay@1.2.3

## 1.2.5

### Patch Changes

- Updated dependencies
  [[`66f7470`](https://github.com/getsentry/spotlight/commit/66f74705aca014c89cdd6ebc587f79eac78b0df5)]:
  - @spotlightjs/overlay@1.2.2

## 1.2.4

### Patch Changes

- Remove Scrollbars in fullscreen
  ([`f15e006`](https://github.com/getsentry/spotlight/commit/f15e0068a64459cf8078c4369ca4108152c09b27))

- Updated dependencies
  [[`fa53bd6`](https://github.com/getsentry/spotlight/commit/fa53bd621b093b60eb8aed7e464f87af8beceb9e),
  [`f15e006`](https://github.com/getsentry/spotlight/commit/f15e0068a64459cf8078c4369ca4108152c09b27),
  [`86e1cb4`](https://github.com/getsentry/spotlight/commit/86e1cb43f19c866cdad31c354496181a8ed8bbbf)]:
  - @spotlightjs/sidecar@1.3.2
  - @spotlightjs/overlay@1.2.1

## 1.2.3

### Patch Changes

- Updated dependencies
  [[`486f94b`](https://github.com/getsentry/spotlight/commit/486f94b6050be4761a119cb74f284edc93b04fab)]:
  - @spotlightjs/sidecar@1.3.1

## 1.2.2

### Patch Changes

- Updated dependencies
  [[`0de3490`](https://github.com/getsentry/spotlight/commit/0de3490575f7d45f124ffe24fbe7b28ffe4cae2a)]:
  - @spotlightjs/sidecar@1.3.0

## 1.2.1

### Patch Changes

- Updated dependencies
  [[`eef528a`](https://github.com/getsentry/spotlight/commit/eef528a2b123b66fc299ff90badf147ddb53a2fc),
  [`0c2a229`](https://github.com/getsentry/spotlight/commit/0c2a229f53f356b6413fded3352f108c0d955333)]:
  - @spotlightjs/overlay@1.2.0

## 1.2.0

### Minor Changes

- Make shipped HTML fullscreen
  ([`fdd14c7`](https://github.com/getsentry/spotlight/commit/fdd14c7e84172f2a0b9bc355968537e161335636))

### Patch Changes

- Updated dependencies
  [[`fdd14c7`](https://github.com/getsentry/spotlight/commit/fdd14c7e84172f2a0b9bc355968537e161335636)]:
  - @spotlightjs/overlay@1.1.0
  - @spotlightjs/sidecar@1.2.0

## 1.1.1

### Patch Changes

- Fix Overlay loading path
  ([`3fd1029`](https://github.com/getsentry/spotlight/commit/3fd1029a1d16a68bae16155a10d72903b7acd2b5))

- Updated dependencies
  [[`3fd1029`](https://github.com/getsentry/spotlight/commit/3fd1029a1d16a68bae16155a10d72903b7acd2b5)]:
  - @spotlightjs/sidecar@1.1.1

## 1.1.0

### Minor Changes

- Serve Overlay from Sidecar ([#248](https://github.com/getsentry/spotlight/pull/248))

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

## 0.0.5

### Patch Changes

- fix: Exports types from overlay ([#222](https://github.com/getsentry/spotlight/pull/222))

- ref(spotlight): Adjust `setupSidecar` calls to pass port in options object
  ([#226](https://github.com/getsentry/spotlight/pull/226))

- Updated dependencies
  [[`d3d1770`](https://github.com/getsentry/spotlight/commit/d3d1770e450852c9cadaa279028084e9494cf657),
  [`7f5b581`](https://github.com/getsentry/spotlight/commit/7f5b581a8e4599c6d42d485046399dc73f59f579),
  [`129a3d4`](https://github.com/getsentry/spotlight/commit/129a3d4abdbcbe6c17007e352ee9e7d883febf25),
  [`129a3d4`](https://github.com/getsentry/spotlight/commit/129a3d4abdbcbe6c17007e352ee9e7d883febf25),
  [`688b07f`](https://github.com/getsentry/spotlight/commit/688b07ff0ccaee8b8aed71a856c4382906485f79),
  [`0fdd4c3`](https://github.com/getsentry/spotlight/commit/0fdd4c3dc106c806037c1c419486f585d6f97e2d)]:
  - @spotlightjs/overlay@0.0.22
  - @spotlightjs/sidecar@0.0.16

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`766e7d5`](https://github.com/getsentry/spotlight/commit/766e7d5ae8002e680e8d8b15db35a4e5b0519e55),
  [`766e7d5`](https://github.com/getsentry/spotlight/commit/766e7d5ae8002e680e8d8b15db35a4e5b0519e55),
  [`218be1c`](https://github.com/getsentry/spotlight/commit/218be1c252fd782437467b9abd9b6e117a9818b5),
  [`e9e9839`](https://github.com/getsentry/spotlight/commit/e9e9839583f8e653362b140c549960f911053a98)]:
  - @spotlightjs/overlay@0.0.21

## 0.0.3

### Patch Changes

- feat(sidecar): Support setting a custom port ([#189](https://github.com/getsentry/spotlight/pull/189))

- Updated dependencies
  [[`98847d2`](https://github.com/getsentry/spotlight/commit/98847d21398a4115e5e0beacc3e9e4040c6165d1),
  [`5923ddc`](https://github.com/getsentry/spotlight/commit/5923ddc2f253a52c3bdb8302603fa6970b044fa2),
  [`d02b2ca`](https://github.com/getsentry/spotlight/commit/d02b2caf423955b19fcea447efdc2682a4167ba7),
  [`3c8a410`](https://github.com/getsentry/spotlight/commit/3c8a410ee1c1396247b8325364948d1998276279)]:
  - @spotlightjs/overlay@0.0.20
  - @spotlightjs/sidecar@0.0.15

## 0.0.2

### Patch Changes

- Move everything to dev deps
  ([`aeb507a`](https://github.com/getsentry/spotlight/commit/aeb507abc4c3ba0c988b6f158959947369061b7b))

- Updated dependencies
  [[`aeb507a`](https://github.com/getsentry/spotlight/commit/aeb507abc4c3ba0c988b6f158959947369061b7b)]:
  - @spotlightjs/overlay@0.0.19
  - @spotlightjs/sidecar@0.0.14

## 0.0.1

### Patch Changes

- feat: Add new @spotlightjs/spotlight package
  ([`61b6d87`](https://github.com/getsentry/spotlight/commit/61b6d879dd6b259383f9fb8022b3ea2186f2083a))

  This package combines the overlay and the sidecar in one package.

- Updated dependencies
  [[`d9c8ed0`](https://github.com/getsentry/spotlight/commit/d9c8ed0fbec2e015137758026a3b5eb0f4d874ba),
  [`71b31ef`](https://github.com/getsentry/spotlight/commit/71b31eff159d8ce36035a3c7b2926c154e0e6ddd),
  [`3fd22af`](https://github.com/getsentry/spotlight/commit/3fd22af0eb2ddc8ef7d10526bcfe45ab6cd25266),
  [`b841b95`](https://github.com/getsentry/spotlight/commit/b841b95dd27e5b4253b9ad94b5afc8e55501f829)]:
  - @spotlightjs/overlay@0.0.18
  - @spotlightjs/sidecar@0.0.13
