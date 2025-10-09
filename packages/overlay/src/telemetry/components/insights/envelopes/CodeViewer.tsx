import { useEffect, useState } from "react";
import { type Highlighter, createHighlighter } from "shiki";

function useShiki() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    createHighlighter({
      themes: ["nord"],
      langs: ["css", "js", "json", "html"],
    }).then(setHighlighter);
  }, []);

  return highlighter;
}

export function CodeViewer({ code, lang }: { code: string; lang: string }) {
  const highlighter = useShiki();

  if (highlighter) {
    // biome-ignore lint/security/noDangerouslySetInnerHtml: Need this for shiki
    return <div dangerouslySetInnerHTML={{ __html: highlighter.codeToHtml(code, { lang, theme: "nord" }) }} />;
  }

  return (
    <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
      {code}
    </pre>
  );
}
