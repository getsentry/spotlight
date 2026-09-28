import { type PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef } from "react";

/**
 * A twinkleplop render function: takes source and render options, returns HTML.
 * Matches the shape returned by each language package's `language()` factory.
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
 * or `null` when we don't have a grammar for it.
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
 * Dynamically import a single grammar package. Each specifier is static so the
 * bundler can split it into its own chunk — the grammar is only fetched the
 * first time a snippet in that language is rendered, instead of eagerly loading
 * every language up front.
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
  /** Resolve a render function for `lang`, or `null` when unsupported. */
  load: (lang: string) => Promise<HighlightFn | null>;
};

const HighlighterContext = createContext<HighlighterContextValue | null>(null);

export function HighlighterProvider({ children }: PropsWithChildren) {
  // Cache resolved render functions and in-flight loads by canonical language
  // so each grammar package is imported and instantiated at most once.
  const cache = useRef(new Map<CanonicalLanguage, Promise<HighlightFn>>());

  const load = useCallback(async (lang: string) => {
    const canonical = resolveLanguage(lang);
    if (!canonical) {
      return null;
    }

    let pending = cache.current.get(canonical);
    if (!pending) {
      pending = importLanguage(canonical).catch(error => {
        // Drop a failed load from the cache so a later render can retry it,
        // instead of pinning this language to a permanently rejected promise.
        cache.current.delete(canonical);
        throw error;
      });
      cache.current.set(canonical, pending);
    }
    return pending;
  }, []);

  const value = useMemo(() => ({ load }), [load]);

  return <HighlighterContext.Provider value={value}>{children}</HighlighterContext.Provider>;
}

export function useHighlighter() {
  return useContext(HighlighterContext);
}
