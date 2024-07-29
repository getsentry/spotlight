# @spotlightjs/electron

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
