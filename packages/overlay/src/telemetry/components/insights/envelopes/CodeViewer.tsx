import { transformerNotationHighlight } from "@shikijs/transformers";
import { useEffect, useState } from "react";
import { type Highlighter, bundledLanguages, createHighlighter } from "shiki/bundle-web.mjs";

const THEME = "github-dark";

function useShiki() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    createHighlighter({
      themes: [THEME],
      langs: Object.keys(bundledLanguages),
    }).then(setHighlighter);
  }, []);

  return highlighter;
}

export function CodeViewer({ code, lang }: { code: string; lang: string }) {
  const highlighter = useShiki();

  if (highlighter && lang in bundledLanguages) {
    return (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Need this for shiki
        dangerouslySetInnerHTML={{
          __html: highlighter.codeToHtml(code, {
            lang,
            theme: THEME,
            transformers: [transformerNotationHighlight()],
          }),
        }}
      />
    );
  }

  return (
    <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-950 rounded-sm">
      {code}
    </pre>
  );
}
