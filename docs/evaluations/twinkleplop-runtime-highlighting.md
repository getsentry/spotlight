# Evaluation: Twinkleplop for runtime code highlighting

**Status:** evaluation — no migration proposed
**Scope:** whether `@twinkleplop/core` is a viable replacement for Shiki in
Spotlight's runtime syntax highlighting, and what would be required to adopt it.
**Tracking issue:** getsentry/spotlight#1356

## Summary

Twinkleplop (`@twinkleplop/core`) is a fast, dependency-free tokenizer with a
published claim of ~22–29× faster tokenization than Shiki on a 7.6 kB TypeScript
sample. That number is a Node microbenchmark of tokenization only; it does not
measure application startup, bundle size, or browser rendering — which is where
Spotlight's highlighting cost actually lives.

The decisive finding is not performance but **API surface**. Twinkleplop is not
a drop-in tokenizer with a bundled language/theme registry. It is a toolkit for
*building* language grammars: you compile grammars from a pattern DSL, assemble
a per-language pipeline, and render with a class-based theme model. Shiki ships
ready-made TextMate grammars for ~200 languages and a scope-based theme that
Spotlight already targets (`sentinel-theme.ts`). Adopting Twinkleplop means
owning grammar authoring and theme translation for every language Spotlight
wants to highlight.

**Recommendation:** do not migrate now. The larger, lower-risk win — and the
cost the issue actually calls out — is Shiki's eager loading of every bundled
language in `ShikiProvider`. Fix that first (lazy per-language loading). Keep
Twinkleplop on the radar as a targeted tokenizer for the hottest, best-defined
languages (TS/JS), gated on it reaching a stable release and a Sentinel-theme
port. See "If we revisit" below for the concrete gating criteria.

## What Spotlight does today

Runtime highlighting is small and centralized:

| File | Role |
| --- | --- |
| `packages/spotlight/src/ui/ShikiProvider.tsx` | Creates one `Highlighter` in `useEffect`, eagerly loading **every** language in `shiki/bundle-web.mjs` (`langs: Object.keys(bundledLanguages)`) with the `sentinelDarkTheme`. |
| `packages/spotlight/src/ui/telemetry/components/insights/envelopes/CodeViewer.tsx` | Calls `highlighter.codeToHtml(code, { lang, theme, transformers: [transformerNotationHighlight()] })` and injects the result via `dangerouslySetInnerHTML`. Falls back to a `<pre>` when the language is not in `bundledLanguages`. |
| `packages/spotlight/src/ui/telemetry/components/events/error/Frame.tsx` | Builds stack-frame source and marks the crashing line with the Shiki notation comment `// [!code highlight]`, consumed by `transformerNotationHighlight()`. |
| `packages/spotlight/src/ui/sentinel-theme.ts` | TextMate-style `ThemeRegistration` (scope → color/font-style) — the Sentinel dark theme. |
| `packages/spotlight/src/ui/index.css` (`.shiki { … }`) | Styles Shiki's emitted markup, including `.highlighted` for the notation transformer. |

`ShikiProvider` is mounted once at the app root (`App.tsx`).

Dependencies: `shiki@^3.13.0` and `@shikijs/transformers@^3.13.0`
(`packages/spotlight/package.json`); the website also depends on `shiki`.

There are two independent costs here, and the issue is right to separate them:

1. **Engine cost** — tokenization/HTML generation per `codeToHtml` call. This is
   what Twinkleplop's benchmark targets.
2. **Eager-loading cost** — `ShikiProvider` initializes *all* bundled languages
   up front, regardless of what the session renders. This inflates the WASM/
   grammar load and startup work and is independent of the engine choice.

## What Twinkleplop actually provides (verified against `@twinkleplop/core@0.2.1`)

Inspected from the published package (npm, MIT, zero runtime deps, ~480 kB
unpacked, latest = `0.2.1`, published two days before this evaluation; all
released versions are `0.x`).

Exports are split into subpaths — `.` (production), `./debug`, `./compile`,
`./tokens`, `./introspector`, `./grammar-mapper`, `./types`. The core API:

- `compile(grammar)` / `create_language(compiledGrammar, pipeline)` — you author
  a grammar (a state machine of `GrammarRule`s: `match`, `range`, `match_within`,
  `state`, `token`, …) and a reclassifier pipeline, then build a `LanguageFn`.
- `tokenize(input, compiledGrammar, introspector?)` — raw tokenization.
- `to_html(input, tokenResult, options?: RenderOptions)` — render tokens to HTML.
  `RenderOptions` supports `class_name`, `line_numbers`, `has_classes` (class vs
  inline styles), `overlays`, `structure: "classic" | "inline"`, per-line/token
  hooks, `indent_guides`, and whitespace rendering.
- A pattern DSL for reclassification: `type`, `seq`, `any_of`, `optional`,
  `capture`, `repeat`, `not`, `balanced_parens`, `params`, `type_span`, etc.
- An **annotation** system (`AnnotationConfig` / `AnnotationPlugin` with `verbs`,
  overlay contributions) — Twinkleplop's own in-source-comment directive
  mechanism, distinct from Shiki's transformer API.
- Theming via `theme_palette` (`Record<string,string> & { background_color }`)
  and `theme_styles` (`Partial<Record<string, readonly font_style[]>>`, where
  `font_style` is `"italic" | "bold" | "underline" | "strikethrough"`), keyed by
  **token type name**, not TextMate scope.

Crucially, `@twinkleplop/core` exposes **no bundled language registry** and **no
prebuilt themes**. There is no analog to Shiki's `bundledLanguages` map that
`CodeViewer` and `ShikiProvider` rely on. Languages come from separate language
packages (or grammars you write); the core is the engine and DSL only.

## Gap analysis: what migration would require

| Concern | Shiki today | Twinkleplop | Migration cost |
| --- | --- | --- | --- |
| **Language coverage** | ~200 bundled grammars via `bundledLanguages`; `CodeViewer` guards `lang in bundledLanguages`. | No bundled registry in core; grammars authored/compiled or pulled from language packages. | **High.** Need a language set + the `lang in …` availability check reimplemented. Any language without a grammar falls back to plain `<pre>`. |
| **Theme (Sentinel)** | `sentinelDarkTheme` is a TextMate `ThemeRegistration` (scope-based, ~40 scope groups). | Class/CSS model keyed by token-type name (`theme_palette` + `theme_styles`). | **High.** No automatic translation from TextMate scopes to Twinkleplop token types; the Sentinel palette must be re-expressed and re-tuned per grammar's token vocabulary. |
| **Notation / crash-line highlight** | `transformerNotationHighlight()` reads `// [!code highlight]` from `Frame.tsx`; styled by `.shiki .highlighted`. | No Shiki transformer API. Has its own annotation plugins + `overlays` in `RenderOptions`; the marker syntax and emitted classes differ. | **Medium.** `Frame.tsx`'s marker convention and the `.highlighted` CSS must be reworked onto Twinkleplop overlays/annotations. |
| **Render integration** | `codeToHtml` → `dangerouslySetInnerHTML`; `.shiki` CSS. | `to_html(...)` returns HTML too — model fits — but class names/structure differ (`class_name`, `has_classes`, `structure`). | **Low–medium.** `CodeViewer` swap is mechanical; the CSS in `index.css` needs new selectors. |
| **Aliases** | Shiki resolves language aliases. | Not provided by core. | **Low–medium.** Alias table maintained by us. |
| **Maturity** | Stable, widely deployed. | `0.x`, newest version days old, single maintainer, custom-hosted docs. | **Risk.** Pre-1.0 API churn; no ecosystem of grammars/themes yet. |

## Performance: what the benchmark does and doesn't tell us

- The ~22–29× figure is **Node tokenization** on one 7.6 kB TS sample. It is a
  real signal that the *engine* is fast, but it is not the metric Spotlight
  cares about.
- Spotlight's user-visible highlighting cost is dominated by **startup**
  (`ShikiProvider` eagerly loading all grammars + WASM) and **first render**,
  neither of which the benchmark measures.
- No numbers exist yet for Spotlight's real inputs: short stack-frame snippets
  (a handful of lines, rendered on frame expand) and insight envelope payloads.
  These are small; per-call tokenization is unlikely to be the bottleneck.
- **Bundle impact is unmeasured.** Twinkleplop core is ~480 kB unpacked; grammars
  add more. Whether the total beats Shiki's lazily-loadable grammars depends
  entirely on how many languages Spotlight ships and how they're loaded.

Any real decision needs three measurements Spotlight does not have today:
1. cold startup time (provider init) before/after,
2. production bundle delta for an equivalent language set,
3. first-render latency on representative stack frames and envelopes.

## The cheaper, orthogonal win

The issue notes eager language loading is "a separate source of cost from the
highlighting engine." It is, and it is fixable **without** changing engines:

- `ShikiProvider` currently loads `Object.keys(bundledLanguages)` — every
  grammar — at startup. Loading languages **lazily on first use** (Shiki's
  `highlighter.loadLanguage(lang)` on demand inside `CodeViewer`, keyed off the
  frame/envelope's actual language) would cut startup cost directly.
- This is a smaller, lower-risk change that keeps the Sentinel theme, the
  notation transformer, and full language coverage intact.

If startup/bundle is the real pain, do this first and re-measure before
considering an engine swap.

## Recommendation

1. **Do not migrate to Twinkleplop now.** The engine speed is attractive but the
   grammar-authoring and theme-porting burden is large, the package is pre-1.0,
   and the benchmark does not target Spotlight's actual costs.
2. **Address eager language loading in `ShikiProvider` independently** as the
   high-value, low-risk improvement.
3. **Revisit Twinkleplop later**, scoped to the highest-traffic, well-specified
   languages (TS/JS for stack frames), only when the gating criteria below are met.

### If we revisit

Adopt only when all hold:

- Twinkleplop reaches a **stable (≥1.0)** release with a committed API.
- A **Sentinel-theme port** exists to Twinkleplop's `theme_palette`/`theme_styles`
  and is visually verified against the current output.
- The **notation/crash-line** behavior in `Frame.tsx` is reproduced via
  Twinkleplop overlays/annotations, with matching `.highlighted` styling.
- A **prototype** shows a measured win on all three metrics above (startup,
  bundle, first render) for Spotlight's real inputs — not the upstream sample.
- A clear plan for **language coverage** (which languages get real grammars, and
  a graceful `<pre>` fallback for the rest), including alias handling.

Scope a first prototype to `CodeViewer` + `Frame.tsx` for TS/JS only, behind the
existing plain-`<pre>` fallback, so unsupported languages degrade cleanly.

## References

- Upstream benchmarks and limitations: https://twinkleplop.pngwn.at/docs/benchmarks
- `@twinkleplop/core` on npm (API verified against `0.2.1`)
- Spotlight integration points: `ShikiProvider.tsx`, `CodeViewer.tsx`,
  `Frame.tsx`, `sentinel-theme.ts`, `index.css` (`.shiki`)
