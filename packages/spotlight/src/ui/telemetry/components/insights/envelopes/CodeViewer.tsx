import { type HighlightFn, useHighlighter } from "@spotlight/ui/HighlighterProvider";
import { useEffect, useState } from "react";

/** Marker mirroring shiki's notation transformer: `// [!code highlight]`. */
const HIGHLIGHT_NOTATION = /\s*\/\/\s*\[!code highlight\]\s*$/;

/**
 * Strip `[!code highlight]` line markers and collect the (1-based) line numbers
 * that carried one, so they can be re-applied as twinkleplop line overlays.
 */
function extractHighlights(code: string): { source: string; highlighted: number[] } {
  const highlighted: number[] = [];
  const lines = code.split("\n").map((line, index) => {
    if (HIGHLIGHT_NOTATION.test(line)) {
      highlighted.push(index + 1);
      return line.replace(HIGHLIGHT_NOTATION, "");
    }
    return line;
  });
  return { source: lines.join("\n"), highlighted };
}

export function CodeViewer({ code, lang }: { code: string; lang: string }) {
  const highlighter = useHighlighter();
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!highlighter || code.length === 0) {
      setHtml(null);
      return;
    }

    let cancelled = false;
    highlighter.load(lang).then((render: HighlightFn | null) => {
      if (cancelled || !render) {
        setHtml(null);
        return;
      }
      const { source, highlighted } = extractHighlights(code);
      setHtml(
        render(source, {
          class_name: "twinkleplop",
          structure: "classic",
          overlays: highlighted.map(line => ({ line, class: "highlighted" })),
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [highlighter, code, lang]);

  if (code.length === 0) {
    return <></>;
  }

  if (html) {
    return (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: twinkleplop returns pre-rendered, escaped HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm bg-primary-950 rounded-sm">
      {extractHighlights(code).source}
    </pre>
  );
}
