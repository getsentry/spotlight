import { useEffect, useState } from "react";
import { type Highlighter, createHighlighter } from "shiki";

export function useShiki() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    createHighlighter({
      themes: ["nord"],
      langs: ["css", "js", "json", "html"],
    }).then(setHighlighter);
  }, []);

  return highlighter;
}
