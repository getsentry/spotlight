# @spotlightjs/astro

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
