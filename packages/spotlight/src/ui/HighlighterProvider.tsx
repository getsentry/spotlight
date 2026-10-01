import { SHIKI_DEFAULT_THEME } from "@spotlight/ui/shiki-constants";
import { type PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef } from "react";

/**
 * A render function: takes source and render options, returns HTML. Matches the
 * shape returned by each twinkleplop language package's `language()` factory;
 * the shiki fallback is adapted to the same signature.
 */
export type HighlightFn = (
  input: string,
  render?: {
    class_name?: string;
    structure?: "classic" | "inline";
    overlays?: { line: number; class: string }[];
  },
) => string;

/** Canonical languages we ship a twinkleplop grammar for. */
type CanonicalLanguage = "javascript" | "typescript" | "python" | "json" | "html" | "css" | "go" | "rust";

/**
 * Map the many `lang` spellings that reach `CodeViewer` (file extensions,
 * Sentry platform strings, common aliases) onto a canonical grammar package,
 * or `null` when twinkleplop has no grammar for it (shiki fallback handles those).
 */
const LANGUAGE_ALIASES: Record<string, CanonicalLanguage> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  node: "javascript",
  javascript: "javascript",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
  py: "python",
  python: "python",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  go: "go",
  golang: "go",
  rs: "rust",
  rust: "rust",
};

export function resolveLanguage(lang: string): CanonicalLanguage | null {
  return LANGUAGE_ALIASES[lang.toLowerCase()] ?? null;
}

/**
 * Dynamically import a single twinkleplop grammar package. Each specifier is
 * static so the bundler can split it into its own chunk — the grammar is only
 * fetched the first time a snippet in that language is rendered.
 */
async function importLanguage(lang: CanonicalLanguage): Promise<HighlightFn> {
  switch (lang) {
    case "javascript":
      return (await import("@twinkleplop/javascript")).language() as HighlightFn;
    case "typescript":
      return (await import("@twinkleplop/typescript")).language() as HighlightFn;
    case "python":
      return (await import("@twinkleplop/python")).language() as HighlightFn;
    case "json":
      return (await import("@twinkleplop/json")).language() as HighlightFn;
    case "html":
      return (await import("@twinkleplop/html")).language() as HighlightFn;
    case "css":
      return (await import("@twinkleplop/css")).language() as HighlightFn;
    case "go":
      return (await import("@twinkleplop/go")).language() as HighlightFn;
    case "rust":
      return (await import("@twinkleplop/rust")).language() as HighlightFn;
  }
}

type HighlighterContextValue = {
  /** Resolve a render function for `lang`, or `null` when it can't be highlighted. */
  load: (lang: string) => Promise<HighlightFn | null>;
};

const HighlighterContext = createContext<HighlighterContextValue | null>(null);

export function HighlighterProvider({ children }: PropsWithChildren) {
  // Cache resolved twinkleplop render functions and in-flight loads by canonical
  // language so each grammar package is imported and instantiated at most once.
  const twinkleCache = useRef(new Map<CanonicalLanguage, Promise<HighlightFn>>());
  // Cache shiki fallback render functions by raw `lang`. Shiki (and its grammar
  // bundle) is only imported the first time a language twinkleplop can't cover is
  // actually requested, so JS/TS-only sessions never pull it into the bundle.
  const shikiCache = useRef(new Map<string, Promise<HighlightFn | null>>());

  const loadTwinkle = useCallback((canonical: CanonicalLanguage) => {
    let pending = twinkleCache.current.get(canonical);
    if (!pending) {
      pending = importLanguage(canonical).catch(error => {
        // Drop a failed load from the cache so a later render can retry it,
        // instead of pinning this language to a permanently rejected promise.
        twinkleCache.current.delete(canonical);
        throw error;
      });
      twinkleCache.current.set(canonical, pending);
    }
    return pending;
  }, []);

  const loadShiki = useCallback((lang: string) => {
    const key = lang.toLowerCase();
    let pending = shikiCache.current.get(key);
    if (!pending) {
      pending = createShikiRender(key).catch(error => {
        shikiCache.current.delete(key);
        throw error;
      });
      shikiCache.current.set(key, pending);
    }
    return pending;
  }, []);

  const load = useCallback(
    (lang: string) => {
      const canonical = resolveLanguage(lang);
      // Prefer the twinkleplop grammar; fall back to shiki for everything else it
      // doesn't cover (e.g. java), preserving the pre-migration language coverage.
      return canonical ? loadTwinkle(canonical) : loadShiki(lang);
    },
    [loadTwinkle, loadShiki],
  );

  const value = useMemo(() => ({ load }), [load]);

  return <HighlighterContext.Provider value={value}>{children}</HighlighterContext.Provider>;
}

/**
 * Build a shiki-backed render function for `lang`, matching the twinkleplop
 * `HighlightFn` signature. Returns `null` when shiki's web bundle has no grammar
 * for the language, so the caller shows the plain-text fallback. Line overlays
 * are reapplied as the same `highlighted` class the twinkleplop path emits.
 */
async function createShikiRender(lang: string): Promise<HighlightFn | null> {
  const { createHighlighter, bundledLanguages } = await import("shiki/bundle-web.mjs");
  if (!(lang in bundledLanguages)) {
    return null;
  }

  const { sentinelDarkTheme } = await import("@spotlight/ui/sentinel-theme");
  const highlighter = await createHighlighter({ themes: [sentinelDarkTheme], langs: [lang] });

  return (input, render) => {
    const overlayLines = new Set((render?.overlays ?? []).map(overlay => overlay.line));
    return highlighter.codeToHtml(input, {
      lang,
      theme: SHIKI_DEFAULT_THEME,
      transformers: [
        {
          name: "spotlight-overlay-highlight",
          line(node, line) {
            if (overlayLines.has(line)) {
              this.addClassToHast(node, "highlighted");
            }
          },
        },
      ],
    });
  };
}

export function useHighlighter() {
  return useContext(HighlighterContext);
}
