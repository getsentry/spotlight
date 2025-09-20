# @spotlightjs/electron

## 1.8.0

### Minor Changes

- Run electron app in background and add a menu tray ([#929](https://github.com/getsentry/spotlight/pull/929))

- Make app window draggable ([#931](https://github.com/getsentry/spotlight/pull/931))

- Added Auto Updater ([#922](https://github.com/getsentry/spotlight/pull/922))

### Patch Changes

- - Implement URL-based routing in overlay with BrowserRouter for web apps and HashRouter for Electron ([#921](https://github.com/getsentry/spotlight/pull/921))
  - Remove sentry-integration.ts and simplify telemetry implementation
  - Moved telemetry logic from App.tsx to dedicated Telemetry component
- Updated dependencies [[`2fe54bb`](https://github.com/getsentry/spotlight/commit/2fe54bb80cb6736aab4b5a7754e9319c1a5ac2ed), [`20783d0`](https://github.com/getsentry/spotlight/commit/20783d0382644cc5fa866f909b71631e8899795b), [`48c6753`](https://github.com/getsentry/spotlight/commit/48c6753ef4a74ac394cbc503c89dbfc8e71a2707), [`65f4e9f`](https://github.com/getsentry/spotlight/commit/65f4e9f2d3f74b9927f6e614173bf4237991c9b3), [`bb85759`](https://github.com/getsentry/spotlight/commit/bb85759dffa8c426f2c227b0a4d0a4fe24bda722), [`1f2096e`](https://github.com/getsentry/spotlight/commit/1f2096e807507b607ae44df2905ad2f2a1211243), [`cec5457`](https://github.com/getsentry/spotlight/commit/cec5457e2722600fe06367d147b4725db290a5ba), [`5670dd4`](https://github.com/getsentry/spotlight/commit/5670dd43477748e5431e83d66e8ac48d2423d46c), [`605b1e1`](https://github.com/getsentry/spotlight/commit/605b1e171e48cb6368d77c02b98ec73fc2d18b72), [`69bfd17`](https://github.com/getsentry/spotlight/commit/69bfd173a30a422138ef87179da6e25ecabc0423), [`3d56a55`](https://github.com/getsentry/spotlight/commit/3d56a55fdbed418a6b6cc1d85e0ff5a7dc330ce2)]:
  - @spotlightjs/sidecar@2.0.0
  - @spotlightjs/overlay@4.0.0

## 1.7.7

### Patch Changes

- fix issues which were causing crashes when launching the app and minor changes ([#885](https://github.com/getsentry/spotlight/pull/885))

## 1.7.6

### Patch Changes

- Updated dependencies [[`3bdc878`](https://github.com/getsentry/spotlight/commit/3bdc878f373510101dfb3b3912fe6f6ed7f9e261), [`66eb0ea`](https://github.com/getsentry/spotlight/commit/66eb0eac18d8a71c8dd7b6d9374f6816a7d56402), [`661877a`](https://github.com/getsentry/spotlight/commit/661877ad9398d42618e959d71be179b2cd76b06c), [`f2d7d0d`](https://github.com/getsentry/spotlight/commit/f2d7d0db56aa560e62d1bdfbb8089ed83b0cd1dc), [`8994010`](https://github.com/getsentry/spotlight/commit/8994010edb6064fc24052a4250c180aa127402d3), [`1d265d9`](https://github.com/getsentry/spotlight/commit/1d265d9fd8ee8469d1c29e0b59d3a45b8943510b), [`431664c`](https://github.com/getsentry/spotlight/commit/431664cf7849063f334631efd1130f5d10de51f9)]:
  - @spotlightjs/overlay@3.2.0
  - @spotlightjs/sidecar@1.12.0

## 1.7.5

### Patch Changes

- Updated dependencies [[`1f1e8d5`](https://github.com/getsentry/spotlight/commit/1f1e8d5c97b813cb95ae7bd526c336292bd8f28b), [`cae5b4f`](https://github.com/getsentry/spotlight/commit/cae5b4fa4235c62a9f1e2e286da038c7accf57a4)]:
  - @spotlightjs/overlay@3.1.0

## 1.7.4

### Patch Changes

- Updated dependencies [[`b54a351`](https://github.com/getsentry/spotlight/commit/b54a351e34676f8c41f2938fa5eca01531d31f77), [`9b46662`](https://github.com/getsentry/spotlight/commit/9b466624de5adfb56a1baf43ca02c6b517ffb886), [`4f3e34a`](https://github.com/getsentry/spotlight/commit/4f3e34a43e5d1949f664fc8ea88f84b1050274af), [`f050291`](https://github.com/getsentry/spotlight/commit/f05029178d341792b82b2a5f18fea3b513cdc409), [`3239cb7`](https://github.com/getsentry/spotlight/commit/3239cb7161ef4f398cc79a3f7c03812b4abab1f4), [`15987ef`](https://github.com/getsentry/spotlight/commit/15987ef063ec254f8906eafa7069bb7aa0145750), [`facaa51`](https://github.com/getsentry/spotlight/commit/facaa5167912bf12634558bdca8ba847d9782e6f), [`0e6c9ed`](https://github.com/getsentry/spotlight/commit/0e6c9ed65efc069d652e4e70010881933dfc64f4), [`cbfaf04`](https://github.com/getsentry/spotlight/commit/cbfaf04d2f1cef2544d53dc49900134c70847404), [`f2ef3db`](https://github.com/getsentry/spotlight/commit/f2ef3dbeebfb2baa4ce5d619b2df8daf57698e8d), [`99bd7dc`](https://github.com/getsentry/spotlight/commit/99bd7dc602006ec3e40304442b9c700cd6f5d7a8)]:
  - @spotlightjs/overlay@3.0.0
  - @spotlightjs/sidecar@1.11.4

## 1.7.3

### Patch Changes

- Updated dependencies
  [[`b09723c797fc9a537bf2e104a945f5979139781b`](https://github.com/getsentry/spotlight/commit/b09723c797fc9a537bf2e104a945f5979139781b),
  [`acfec0fce7d9d10beb46894321d44bb5950aa4d3`](https://github.com/getsentry/spotlight/commit/acfec0fce7d9d10beb46894321d44bb5950aa4d3)]:
  - @spotlightjs/overlay@2.15.1

## 1.7.2

### Patch Changes

- Updated dependencies
  [[`2fb8fff04c392a0e1aed133a8fee79f1e8f489b7`](https://github.com/getsentry/spotlight/commit/2fb8fff04c392a0e1aed133a8fee79f1e8f489b7),
  [`ef48e8c96b20d91423015dd454ec7a63ff56dc4c`](https://github.com/getsentry/spotlight/commit/ef48e8c96b20d91423015dd454ec7a63ff56dc4c),
  [`5f2a382edd3694bc5019465ad1e4039c869aaadc`](https://github.com/getsentry/spotlight/commit/5f2a382edd3694bc5019465ad1e4039c869aaadc),
  [`dd18f7e61e90f277aced4f422683eb0f16cfce2e`](https://github.com/getsentry/spotlight/commit/dd18f7e61e90f277aced4f422683eb0f16cfce2e)]:
  - @spotlightjs/overlay@2.15.0

## 1.7.1

### Patch Changes

- Updated dependencies
  [[`893572a959d94aae2dce2b49e91d43ea649233fa`](https://github.com/getsentry/spotlight/commit/893572a959d94aae2dce2b49e91d43ea649233fa)]:
  - @spotlightjs/overlay@2.14.1

## 1.7.0

### Minor Changes

- feat: Keep profile spans collapsed ([#737](https://github.com/getsentry/spotlight/pull/737))

### Patch Changes

- fix: Null-check sentryClient.\_options ([#736](https://github.com/getsentry/spotlight/pull/736))

- Updated dependencies
  [[`3d569f30fb746d90ecabaac35d23d980360ea99c`](https://github.com/getsentry/spotlight/commit/3d569f30fb746d90ecabaac35d23d980360ea99c),
  [`7ea7de17b7ccf9f0c8edb8b413176d2f3482780c`](https://github.com/getsentry/spotlight/commit/7ea7de17b7ccf9f0c8edb8b413176d2f3482780c),
  [`263ba283efa247e05a022d7f1305cbf819e3e783`](https://github.com/getsentry/spotlight/commit/263ba283efa247e05a022d7f1305cbf819e3e783),
  [`7ac9fd255cfe85d66e79d632e1d309c3e88d8092`](https://github.com/getsentry/spotlight/commit/7ac9fd255cfe85d66e79d632e1d309c3e88d8092),
  [`a76b2dadb28ce8699c80fc81b709050655bd4629`](https://github.com/getsentry/spotlight/commit/a76b2dadb28ce8699c80fc81b709050655bd4629),
  [`d3a2f0a0fae9074802b0551f3e1662833c1423c9`](https://github.com/getsentry/spotlight/commit/d3a2f0a0fae9074802b0551f3e1662833c1423c9),
  [`f2a48b05a41f80e08d1666247f7ccae60bc3d9e7`](https://github.com/getsentry/spotlight/commit/f2a48b05a41f80e08d1666247f7ccae60bc3d9e7),
  [`6d26f0d21b3ae75e3d81e48ceb2d8f727a94420f`](https://github.com/getsentry/spotlight/commit/6d26f0d21b3ae75e3d81e48ceb2d8f727a94420f),
  [`a8f632357d9dcc46187b00724c14dd4423dfa467`](https://github.com/getsentry/spotlight/commit/a8f632357d9dcc46187b00724c14dd4423dfa467),
  [`9888dbfc6778de910a2aeae9f3e86f0b2f716a18`](https://github.com/getsentry/spotlight/commit/9888dbfc6778de910a2aeae9f3e86f0b2f716a18),
  [`ced3e736dfef15d368cac202a10eec4eba7508be`](https://github.com/getsentry/spotlight/commit/ced3e736dfef15d368cac202a10eec4eba7508be)]:
  - @spotlightjs/overlay@2.14.0
  - @spotlightjs/sidecar@1.11.3

## 1.6.0

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
  [`448062fd45799832fc3240656d543696d438d5ab`](https://github.com/getsentry/spotlight/commit/448062fd45799832fc3240656d543696d438d5ab),
  [`79506149f545487e67cdff7eab7393c619c8afd9`](https://github.com/getsentry/spotlight/commit/79506149f545487e67cdff7eab7393c619c8afd9)]:
  - @spotlightjs/overlay@2.13.0

## 1.5.1

### Patch Changes

- Updated dependencies
  [[`0639f6ac39d2438d2dce36fd29b67bdeef7a4ddd`](https://github.com/getsentry/spotlight/commit/0639f6ac39d2438d2dce36fd29b67bdeef7a4ddd)]:
  - @spotlightjs/overlay@2.12.1

## 1.5.0

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

- Fix Astro v5 compatibility ([#706](https://github.com/getsentry/spotlight/pull/706))

  Upgraded all Astro dependencies to v5+. This required suppressing Sentry instrumentation on the sidecar when used
  programmatically (unless explicitly passed `isStandalone: true`) to prevent Spotlight spamming itself with
  transactions from the very sidecar instance that it is running.

  BREAKING: We had to bump minimum required Astro version for the Astro plugin to 4.7+ as we needed the new dev toolbar
  app APIs.

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
  - @spotlightjs/overlay@2.12.0
  - @spotlightjs/sidecar@1.11.2

## 1.4.3

### Patch Changes

- Updated dependencies
  [[`29cd395b667f3fcad8c5c555f94935a1d60f2f52`](https://github.com/getsentry/spotlight/commit/29cd395b667f3fcad8c5c555f94935a1d60f2f52)]:
  - @spotlightjs/overlay@2.11.1

## 1.4.2

### Patch Changes

- Updated dependencies
  [[`83eaaa06231776c7bc245348636aca564268cad4`](https://github.com/getsentry/spotlight/commit/83eaaa06231776c7bc245348636aca564268cad4)]:
  - @spotlightjs/overlay@2.11.0

## 1.4.1

### Patch Changes

- Updated dependencies
  [[`03e386af2024eda44c02952a06433e4d4ecb3356`](https://github.com/getsentry/spotlight/commit/03e386af2024eda44c02952a06433e4d4ecb3356),
  [`416fecd778d4829d490b07ec4d500946fa439210`](https://github.com/getsentry/spotlight/commit/416fecd778d4829d490b07ec4d500946fa439210)]:
  - @spotlightjs/overlay@2.10.1
  - @spotlightjs/sidecar@1.11.1

## 1.4.0

### Minor Changes

- Render placeholders when missing known attributes in Sentry events
  ([#656](https://github.com/getsentry/spotlight/pull/656))

### Patch Changes

- Add `spotlight@` prefix to Sentry releases to distinguish them
  ([#660](https://github.com/getsentry/spotlight/pull/660))

- Updated dependencies
  [[`8bed105e28f11c139c00f6b4a63717b1fb99d396`](https://github.com/getsentry/spotlight/commit/8bed105e28f11c139c00f6b4a63717b1fb99d396),
  [`4c1b619079d4a1ca0e280dedef89bb8e1bf3f069`](https://github.com/getsentry/spotlight/commit/4c1b619079d4a1ca0e280dedef89bb8e1bf3f069),
  [`9606eb25434468bb9377569667f4071a177b85ab`](https://github.com/getsentry/spotlight/commit/9606eb25434468bb9377569667f4071a177b85ab),
  [`cfa9cc967da8aa862f55c3880aab44f7d5b5eeb4`](https://github.com/getsentry/spotlight/commit/cfa9cc967da8aa862f55c3880aab44f7d5b5eeb4),
  [`277bd766aead9a6eabf043cc2490f59d0e1729b6`](https://github.com/getsentry/spotlight/commit/277bd766aead9a6eabf043cc2490f59d0e1729b6),
  [`356890c6faf4ef3d9ebf85615e3f43f34fca0439`](https://github.com/getsentry/spotlight/commit/356890c6faf4ef3d9ebf85615e3f43f34fca0439)]:
  - @spotlightjs/overlay@2.10.0
  - @spotlightjs/sidecar@1.11.0

## 1.3.0

### Minor Changes

- Add support for rich breadcrumbs ([#632](https://github.com/getsentry/spotlight/pull/632))

### Patch Changes

- More resillient envelope parsing to prevent crashes on bad data
  ([#629](https://github.com/getsentry/spotlight/pull/629))

- Fix encoding related corruption on binary envelope payloads ([#631](https://github.com/getsentry/spotlight/pull/631))

- Updated dependencies
  [[`09d3179ccadb61a1fbb119d3a2a8d9315921442e`](https://github.com/getsentry/spotlight/commit/09d3179ccadb61a1fbb119d3a2a8d9315921442e),
  [`319fef8422dea9425b7f230eab9b7294fbeb5a72`](https://github.com/getsentry/spotlight/commit/319fef8422dea9425b7f230eab9b7294fbeb5a72),
  [`9759da2d2951e77b1aabd408769b89066d91425e`](https://github.com/getsentry/spotlight/commit/9759da2d2951e77b1aabd408769b89066d91425e),
  [`0c2ade8e5699e855a31a603067aa575d7580894e`](https://github.com/getsentry/spotlight/commit/0c2ade8e5699e855a31a603067aa575d7580894e),
  [`12c9552909f8b54f4106e2a2f955475955c0413a`](https://github.com/getsentry/spotlight/commit/12c9552909f8b54f4106e2a2f955475955c0413a)]:
  - @spotlightjs/overlay@2.9.0
  - @spotlightjs/sidecar@1.10.0

## 1.2.2

### Patch Changes

- Updated dependencies
  [[`d9a91975334e213c59692fb087aab47799149888`](https://github.com/getsentry/spotlight/commit/d9a91975334e213c59692fb087aab47799149888)]:
  - @spotlightjs/sidecar@1.9.4
  - @spotlightjs/overlay@2.8.1

## 1.2.1

### Patch Changes

- Updated dependencies
  [[`7ea060b832a67cf39676d7fbdbbecb02bb2830e3`](https://github.com/getsentry/spotlight/commit/7ea060b832a67cf39676d7fbdbbecb02bb2830e3),
  [`705595349718abb1dea188efc92ab02a4268f323`](https://github.com/getsentry/spotlight/commit/705595349718abb1dea188efc92ab02a4268f323),
  [`76bc48618812f260b8788b83926fa36fbd9ade35`](https://github.com/getsentry/spotlight/commit/76bc48618812f260b8788b83926fa36fbd9ade35),
  [`4716ddeda0e52289b0f9bc9889ffcf957a69d1a8`](https://github.com/getsentry/spotlight/commit/4716ddeda0e52289b0f9bc9889ffcf957a69d1a8),
  [`a77a8698bd892762b149b555058eb345fac2c686`](https://github.com/getsentry/spotlight/commit/a77a8698bd892762b149b555058eb345fac2c686),
  [`6240009c99fa4699f25325e356b32dc8849e3b92`](https://github.com/getsentry/spotlight/commit/6240009c99fa4699f25325e356b32dc8849e3b92)]:
  - @spotlightjs/overlay@2.8.1
  - @spotlightjs/sidecar@1.9.3

## 1.2.0

### Minor Changes

- Add method name to trace list ([#599](https://github.com/getsentry/spotlight/pull/599))

### Patch Changes

- Updated dependencies
  [[`0ce5ee3206c0ce2e10a523fb3dbe6bff05ef2e01`](https://github.com/getsentry/spotlight/commit/0ce5ee3206c0ce2e10a523fb3dbe6bff05ef2e01),
  [`678dbf7240b7b97fe191356e1ec35d20875e132b`](https://github.com/getsentry/spotlight/commit/678dbf7240b7b97fe191356e1ec35d20875e132b),
  [`a41abc5685fe05025edbd04e90dae10b96b99516`](https://github.com/getsentry/spotlight/commit/a41abc5685fe05025edbd04e90dae10b96b99516),
  [`12ab0a765325030fa4d1405cd172329e1ecfc817`](https://github.com/getsentry/spotlight/commit/12ab0a765325030fa4d1405cd172329e1ecfc817),
  [`630b83b5631d366eaa7fbdd1bb8756c591a506f3`](https://github.com/getsentry/spotlight/commit/630b83b5631d366eaa7fbdd1bb8756c591a506f3),
  [`19cbcbf58db52eadef927a0e25426381071be3fc`](https://github.com/getsentry/spotlight/commit/19cbcbf58db52eadef927a0e25426381071be3fc)]:
  - @spotlightjs/overlay@2.8.0
  - @spotlightjs/sidecar@1.9.2

## 1.1.13

### Patch Changes

- No change, just to fix a broken release ([#576](https://github.com/getsentry/spotlight/pull/576))

- Updated dependencies
  [[`df760b525843e53af891626e96d8e8086bb1473f`](https://github.com/getsentry/spotlight/commit/df760b525843e53af891626e96d8e8086bb1473f)]:
  - @spotlightjs/overlay@2.7.1
  - @spotlightjs/sidecar@1.9.1

## 1.1.12

### Patch Changes

- Updated dependencies
  [[`4d1e07eda8e5ab04db2d1e6bb14aa823e2f5d4e0`](https://github.com/getsentry/spotlight/commit/4d1e07eda8e5ab04db2d1e6bb14aa823e2f5d4e0),
  [`3ec99001202fd66a81486cc49a47452eb9e3e34b`](https://github.com/getsentry/spotlight/commit/3ec99001202fd66a81486cc49a47452eb9e3e34b),
  [`2e4d90c369c6345b38c085cea89142647c4b6be2`](https://github.com/getsentry/spotlight/commit/2e4d90c369c6345b38c085cea89142647c4b6be2),
  [`84f029db0e76f9295b38349f659457878df6924d`](https://github.com/getsentry/spotlight/commit/84f029db0e76f9295b38349f659457878df6924d),
  [`ab5181c645bcee3ab42a4f28db4daab47b5852a5`](https://github.com/getsentry/spotlight/commit/ab5181c645bcee3ab42a4f28db4daab47b5852a5),
  [`7b9329c8c59a25cfe4cec7cbd9c6f231cf099220`](https://github.com/getsentry/spotlight/commit/7b9329c8c59a25cfe4cec7cbd9c6f231cf099220),
  [`6bd2937adfcd8721af6ccd5f031860691ce6e46f`](https://github.com/getsentry/spotlight/commit/6bd2937adfcd8721af6ccd5f031860691ce6e46f),
  [`aba5c072c59f3777c47832d1532d732237b1b9dd`](https://github.com/getsentry/spotlight/commit/aba5c072c59f3777c47832d1532d732237b1b9dd),
  [`1749cb3a06576a0d94f77f0831cd088045a762fb`](https://github.com/getsentry/spotlight/commit/1749cb3a06576a0d94f77f0831cd088045a762fb),
  [`5c0b1624bac267554d93bc81d17414159f0b9fe0`](https://github.com/getsentry/spotlight/commit/5c0b1624bac267554d93bc81d17414159f0b9fe0),
  [`c88e50edd07c56c7368ff6788bbaa938e3f9f6b8`](https://github.com/getsentry/spotlight/commit/c88e50edd07c56c7368ff6788bbaa938e3f9f6b8)]:
  - @spotlightjs/overlay@2.7.0
  - @spotlightjs/sidecar@1.9.0

## 1.1.11

### Patch Changes

- Updated dependencies
  [[`728f62310ac5ead03ba23fb393e2557b4cb944b1`](https://github.com/getsentry/spotlight/commit/728f62310ac5ead03ba23fb393e2557b4cb944b1)]:
  - @spotlightjs/overlay@2.6.0

## 1.1.10

### Patch Changes

- Fix race condition on event processing - prevent doubling of events
  ([#528](https://github.com/getsentry/spotlight/pull/528))

- Updated dependencies
  [[`149e95bd02af41618bc74b365c71ddf99358672f`](https://github.com/getsentry/spotlight/commit/149e95bd02af41618bc74b365c71ddf99358672f),
  [`f22222717dcf2482892e1cc83c233c83ba03211d`](https://github.com/getsentry/spotlight/commit/f22222717dcf2482892e1cc83c233c83ba03211d)]:
  - @spotlightjs/overlay@2.5.2

## 1.1.9

### Patch Changes

- Fixed infinite render loops and optimized rerenders ([#522](https://github.com/getsentry/spotlight/pull/522))

- Updated dependencies
  [[`df9cd954323648d8c22e61643520a1642b8884ca`](https://github.com/getsentry/spotlight/commit/df9cd954323648d8c22e61643520a1642b8884ca)]:
  - @spotlightjs/overlay@2.5.1

## 1.1.8

### Patch Changes

- Updated dependencies
  [[`f1bcab38878dd62c18fb2b62d92ffa02eed62532`](https://github.com/getsentry/spotlight/commit/f1bcab38878dd62c18fb2b62d92ffa02eed62532),
  [`5b6dbba62f3cdf432723b8740c75dbee04923688`](https://github.com/getsentry/spotlight/commit/5b6dbba62f3cdf432723b8740c75dbee04923688),
  [`507c77418b4005e71a1959d82cf6e007dbd9ef93`](https://github.com/getsentry/spotlight/commit/507c77418b4005e71a1959d82cf6e007dbd9ef93)]:
  - @spotlightjs/sidecar@1.8.0
  - @spotlightjs/overlay@2.5.0

## 1.1.7

### Patch Changes

- Updated dependencies
  [[`4acbad0ac4e5dc5a466af13ab2de50169bf8867b`](https://github.com/getsentry/spotlight/commit/4acbad0ac4e5dc5a466af13ab2de50169bf8867b),
  [`50135855e46c67c44d960c0ce0c22e001abcf982`](https://github.com/getsentry/spotlight/commit/50135855e46c67c44d960c0ce0c22e001abcf982),
  [`365ab8a1c085cf52a6620c0b8438eac44967f70f`](https://github.com/getsentry/spotlight/commit/365ab8a1c085cf52a6620c0b8438eac44967f70f)]:
  - @spotlightjs/overlay@2.4.0

## 1.1.6

### Patch Changes

- Fix Sentry init error at startup ([#494](https://github.com/getsentry/spotlight/pull/494))

## 1.1.5

### Patch Changes

- Upgrade Electron stack for macOS 15 compatibility ([#490](https://github.com/getsentry/spotlight/pull/490))

## 1.1.4

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

## 1.1.3

### Patch Changes

- Updated dependencies
  [[`0f10d81d60bde5753921094c7f7d7c5aa71acbaf`](https://github.com/getsentry/spotlight/commit/0f10d81d60bde5753921094c7f7d7c5aa71acbaf),
  [`7837149f0ce2de84a84eb1e0df7c6e4f317741d0`](https://github.com/getsentry/spotlight/commit/7837149f0ce2de84a84eb1e0df7c6e4f317741d0)]:
  - @spotlightjs/overlay@2.2.1
  - @spotlightjs/sidecar@1.7.0

## 1.1.2

### Patch Changes

- Allow trailing slash in DSN endpoint ([#466](https://github.com/getsentry/spotlight/pull/466))

- Updated dependencies
  [[`f890e1b15c8c493916f4d3c68f6f2a259ae21cea`](https://github.com/getsentry/spotlight/commit/f890e1b15c8c493916f4d3c68f6f2a259ae21cea)]:
  - @spotlightjs/sidecar@1.6.2
  - @spotlightjs/overlay@2.2.0

## 1.1.1

### Patch Changes

- Fix dependency issues with sidecar ([#464](https://github.com/getsentry/spotlight/pull/464))

- Updated dependencies
  [[`9fccaae507324671a16e939d1ed4a38539750827`](https://github.com/getsentry/spotlight/commit/9fccaae507324671a16e939d1ed4a38539750827)]:
  - @spotlightjs/sidecar@1.6.1
  - @spotlightjs/overlay@2.2.0

## 1.1.0

### Minor Changes

- Add ability to use sidecar URL in a DSN ([#452](https://github.com/getsentry/spotlight/pull/452))

### Patch Changes

- Updated dependencies
  [[`0a6486b14d96a0eafec27a94707e4715b9fc3583`](https://github.com/getsentry/spotlight/commit/0a6486b14d96a0eafec27a94707e4715b9fc3583),
  [`9a7357f1dedc66d030358176bee777715b09c41b`](https://github.com/getsentry/spotlight/commit/9a7357f1dedc66d030358176bee777715b09c41b),
  [`06f3070867534641dbb5c394e5513ca9781bbfa8`](https://github.com/getsentry/spotlight/commit/06f3070867534641dbb5c394e5513ca9781bbfa8),
  [`725cbb5daea8682fdf8fefb952ddce68c97c4d6f`](https://github.com/getsentry/spotlight/commit/725cbb5daea8682fdf8fefb952ddce68c97c4d6f)]:
  - @spotlightjs/sidecar@1.6.0
  - @spotlightjs/overlay@2.2.0

## 1.0.1

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

## 1.0.0

This Major version does not include any breaking changes the Electron app. It was only updated because it depends on
`@spotlightjs/overlay`. You can simply update to the latest version!

Head over to the [Spotlight Docs](https://spotlightjs.com/setup/migration/#updating-from-1x-to-2x) for more details!

### Major Changes

- feat: Drop Support for JS SDK <7.99.0 and add support for JS SDK 8.x
  ([`b7e5bb22a53bdb650136e01e6d0b57e4435dc279`](https://github.com/getsentry/spotlight/commit/b7e5bb22a53bdb650136e01e6d0b57e4435dc279))

  The Spotlight UI (overlay) was updated to version 2 to ensure compatibility with version 8 of Sentry's JavaScript
  SDKs.

  Here's what you need to do to update to the new major version:

  - If you're using a Sentry JavaScript SDK on your host app where the spotlight overlay is running, ensure that you use
    version `8` or `>=7.99.0` of your `@sentry/<sdk>` SDK. Older v7 versions will not work correctly anymore.
  - Good news: There are **no public API** changes! You don't need to make any changes to your code.

### Minor Changes

- feat: Support versioned Sentry carrier object introduced in 8.6.0+
  ([`924fa828db2e2bc38045b2b3e6845819c37cf810`](https://github.com/getsentry/spotlight/commit/924fa828db2e2bc38045b2b3e6845819c37cf810))

### Patch Changes

- - fix(electron): Fixed error handling in electron app.
    ([`076d953f86dd409f2a4b3d4aa07c6b1c2b6f58e5`](https://github.com/getsentry/spotlight/commit/076d953f86dd409f2a4b3d4aa07c6b1c2b6f58e5))
  - fix(overlay): Fixed parsing of frame vars present in stacktrace in Error Events.
- Updated dependencies
  [[`b7e5bb22a53bdb650136e01e6d0b57e4435dc279`](https://github.com/getsentry/spotlight/commit/b7e5bb22a53bdb650136e01e6d0b57e4435dc279),
  [`9f79f3b166220d8a485bda8999a4d2bf3805fedc`](https://github.com/getsentry/spotlight/commit/9f79f3b166220d8a485bda8999a4d2bf3805fedc),
  [`924fa828db2e2bc38045b2b3e6845819c37cf810`](https://github.com/getsentry/spotlight/commit/924fa828db2e2bc38045b2b3e6845819c37cf810),
  [`e80634f364f4145d51b6c6ab221b7e613123dd66`](https://github.com/getsentry/spotlight/commit/e80634f364f4145d51b6c6ab221b7e613123dd66),
  [`076d953f86dd409f2a4b3d4aa07c6b1c2b6f58e5`](https://github.com/getsentry/spotlight/commit/076d953f86dd409f2a4b3d4aa07c6b1c2b6f58e5)]:
  - @spotlightjs/overlay@2.0.0

## 1.0.0-alpha.2

### Minor Changes

- feat: Support versioned Sentry carrier object introduced in 8.6.0+
  ([#402](https://github.com/getsentry/spotlight/pull/402))

### Patch Changes

- Updated dependencies
  [[`010162a4672cae3be20379730e18826627a6f01b`](https://github.com/getsentry/spotlight/commit/010162a4672cae3be20379730e18826627a6f01b)]:
  - @spotlightjs/overlay@2.0.0-alpha.2

## 1.0.0-alpha.1

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

## 1.0.0-alpha.0

### Major Changes

- feat: Make Spotlight compatible with Sentry SDKs v8

## 0.0.24

### Patch Changes

- Updated dependencies
  [[`4a8c36a`](https://github.com/getsentry/spotlight/commit/4a8c36a435c3af9ac820be7ee1a6e1d94c377f8e),
  [`2e0b536`](https://github.com/getsentry/spotlight/commit/2e0b536b0b0ce3a5b92023f2c9c973bd819dd263)]:
  - @spotlightjs/overlay@1.8.3

### Patch Changes

- Updated dependencies []:
  - @spotlightjs/overlay@2.0.0-alpha.0

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`1ee2c98`](https://github.com/getsentry/spotlight/commit/1ee2c98a70569d16ab98feef2caddc18e578a114)]:
  - @spotlightjs/overlay@1.8.2

## 0.0.22

### Patch Changes

- Updated dependencies
  [[`0d5d677`](https://github.com/getsentry/spotlight/commit/0d5d677a78fecd7f5027792d211b0c18f906b8e1)]:
  - @spotlightjs/overlay@1.8.1

## 0.0.21

### Patch Changes

- Updated dependencies
  [[`dc7b649`](https://github.com/getsentry/spotlight/commit/dc7b649a40d22066799ef7df389aa1feb1e61d78),
  [`70608a5`](https://github.com/getsentry/spotlight/commit/70608a5865ce4421dbe83a78f719890d64fd8e21),
  [`28a09e9`](https://github.com/getsentry/spotlight/commit/28a09e92a53757cf96c2297b926217659cb94788)]:
  - @spotlightjs/overlay@1.8.0

## 0.0.20

### Patch Changes

- 1. Removed clear events button for electron app. ([#352](https://github.com/getsentry/spotlight/pull/352))
  2. Added clear events function in Reload and force reload toolbar options in electron app.
  3. Created a event listener to clear events data.
  4. Added a reset function in integration.
- Updated dependencies
  [[`bbca69e`](https://github.com/getsentry/spotlight/commit/bbca69ebeba4892e9c944f1b778873b8b7b252a0),
  [`bbca69e`](https://github.com/getsentry/spotlight/commit/bbca69ebeba4892e9c944f1b778873b8b7b252a0),
  [`2d37041`](https://github.com/getsentry/spotlight/commit/2d37041d621691e066712838ae55caa8bc696671),
  [`0a88e09`](https://github.com/getsentry/spotlight/commit/0a88e09eb577bed11d4a61ef402cf3748d15fe2e),
  [`1560645`](https://github.com/getsentry/spotlight/commit/1560645a96d38401fc23aa289992950dfb8d8a8e),
  [`819f153`](https://github.com/getsentry/spotlight/commit/819f153a3cd6f4dd947ff612e5ca2920e4ce710c)]:
  - @spotlightjs/overlay@1.7.0

## 0.0.19

### Patch Changes

- Updated dependencies
  [[`c2cf7a8`](https://github.com/getsentry/spotlight/commit/c2cf7a88ad36b2e4563dee99b7fcee10d3380b41),
  [`facce9d`](https://github.com/getsentry/spotlight/commit/facce9d979ae2f1981e75c0a2cc86d00ad6f5b87)]:
  - @spotlightjs/overlay@1.6.0
  - @spotlightjs/sidecar@1.4.0

## 0.0.18

### Patch Changes

- Updated dependencies
  [[`8983a8f`](https://github.com/getsentry/spotlight/commit/8983a8fdd58d383f3c610c9c235631c578902d13)]:
  - @spotlightjs/overlay@1.5.0

## 0.0.17

### Patch Changes

- Updated dependencies
  [[`c47c1d6`](https://github.com/getsentry/spotlight/commit/c47c1d6857c7b9b0282f65317b53616997218281)]:
  - @spotlightjs/overlay@1.4.1

## 0.0.16

### Patch Changes

- Updated dependencies
  [[`908cc08`](https://github.com/getsentry/spotlight/commit/908cc083f981c81b68a11109545d183184bbdd06),
  [`92d5962`](https://github.com/getsentry/spotlight/commit/92d5962b77b0a3419dd729452af40d9c40a30ecc),
  [`080b607`](https://github.com/getsentry/spotlight/commit/080b607bf8a3b4419b54170b137776497043836a)]:
  - @spotlightjs/overlay@1.4.0

## 0.0.15

### Patch Changes

- Updated dependencies
  [[`996754b`](https://github.com/getsentry/spotlight/commit/996754bc915572165cabcf66337afd74e64f7eb8),
  [`5f13735`](https://github.com/getsentry/spotlight/commit/5f13735699b92f07360d48100a0aee37af26feb6),
  [`5691e9c`](https://github.com/getsentry/spotlight/commit/5691e9cc4d7f2be537e5c9de82a3540a8aa8fbd9),
  [`3eb0afd`](https://github.com/getsentry/spotlight/commit/3eb0afd9934ea16c99603a749db60352cc426908),
  [`52a6eab`](https://github.com/getsentry/spotlight/commit/52a6eab5f3030e9dcd781f5dd6afb80f15cb46db)]:
  - @spotlightjs/overlay@1.3.1
  - @spotlightjs/sidecar@1.3.5

## 0.0.14

### Patch Changes

- 1. Added functions to report errors in case of an error in the app.
     ([#303](https://github.com/getsentry/spotlight/pull/303))
  2. Added an error page for the Electron app.
- Updated dependencies
  [[`f77819a`](https://github.com/getsentry/spotlight/commit/f77819af59ff6c369795ae190b0b3630454f0a00),
  [`f5a555d`](https://github.com/getsentry/spotlight/commit/f5a555dfc29e752c02cf856d75a92348d1e5920d),
  [`60b1b69`](https://github.com/getsentry/spotlight/commit/60b1b69293a15d56a3ecac5127d66e57b2640d6c),
  [`43f3196`](https://github.com/getsentry/spotlight/commit/43f3196163851f828e4bfe151a34af2ad2c21798)]:
  - @spotlightjs/overlay@1.3.0
  - @spotlightjs/sidecar@1.3.4

## 0.0.13

### Patch Changes

- Store Attachment of request in case of an error
  ([`b864dbd`](https://github.com/getsentry/spotlight/commit/b864dbda8007eb3a509b5045b9775140c04a519c))

- Updated dependencies
  [[`b864dbd`](https://github.com/getsentry/spotlight/commit/b864dbda8007eb3a509b5045b9775140c04a519c),
  [`14eadb9`](https://github.com/getsentry/spotlight/commit/14eadb97f34d3430e201cc3a29170bf22f02e4ff),
  [`fed3835`](https://github.com/getsentry/spotlight/commit/fed3835e989b10b82d52a079be15738bf5527c61)]:
  - @spotlightjs/sidecar@1.3.3
  - @spotlightjs/overlay@1.2.3

## 0.0.12

### Patch Changes

- This time it will work ([#291](https://github.com/getsentry/spotlight/pull/291))

## 0.0.11

### Patch Changes

- Another Release ([`7f232ce`](https://github.com/getsentry/spotlight/commit/7f232cecfc96ded3fc89a951bce744fa91c58eb6))

## 0.0.10

### Patch Changes

- Add Badge to app icon
  ([`d094dad`](https://github.com/getsentry/spotlight/commit/d094dad0ee70a4e0ddc6d30378acdede6be16f7d))

## 0.0.9

### Patch Changes

- Split App into two architectures
  ([`a27064f`](https://github.com/getsentry/spotlight/commit/a27064fedb85c737359193a3607e8e86eeb309ab))

- Updated dependencies
  [[`66f7470`](https://github.com/getsentry/spotlight/commit/66f74705aca014c89cdd6ebc587f79eac78b0df5)]:
  - @spotlightjs/overlay@1.2.2

## 0.0.8

### Patch Changes

- Publish ([`af9761a`](https://github.com/getsentry/spotlight/commit/af9761a990c0889d3fea7b023e792288af8264f1))

- Publish ([`c32c34a`](https://github.com/getsentry/spotlight/commit/c32c34a1059df8dde272c8d25babad5114dd254b))

## 0.0.7

### Patch Changes

- Publish ([`bde85dd`](https://github.com/getsentry/spotlight/commit/bde85dd39629575706eacf537ba31036f7f791cc))

## 0.0.6

### Patch Changes

- Publish Electron App
  ([`f90b49d`](https://github.com/getsentry/spotlight/commit/f90b49da56e9aa2dadfc5ffb3557ac2a0470ad7d))

## 0.0.5

### Patch Changes

- Publish ([`11b9ab8`](https://github.com/getsentry/spotlight/commit/11b9ab83bca07b8700e84de5f7b257b4292c6de7))

## 0.0.4

### Patch Changes

- Fix Publish ([`2b8dbf9`](https://github.com/getsentry/spotlight/commit/2b8dbf9681ff71eb7e93241475be67bfb9b5596e))

## 0.0.3

### Patch Changes

- Publish step ([`03adeba`](https://github.com/getsentry/spotlight/commit/03adeba07bab092bbc66e2ac859ea38fbd82a77b))

## 0.0.2

### Patch Changes

- Remove Scrollbars in fullscreen
  ([`f15e006`](https://github.com/getsentry/spotlight/commit/f15e0068a64459cf8078c4369ca4108152c09b27))

- Updated dependencies
  [[`fa53bd6`](https://github.com/getsentry/spotlight/commit/fa53bd621b093b60eb8aed7e464f87af8beceb9e),
  [`f15e006`](https://github.com/getsentry/spotlight/commit/f15e0068a64459cf8078c4369ca4108152c09b27),
  [`86e1cb4`](https://github.com/getsentry/spotlight/commit/86e1cb43f19c866cdad31c354496181a8ed8bbbf)]:
  - @spotlightjs/sidecar@1.3.2
  - @spotlightjs/overlay@1.2.1
