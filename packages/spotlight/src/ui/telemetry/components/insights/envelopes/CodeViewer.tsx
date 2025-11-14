import { transformerNotationHighlight } from "@shikijs/transformers";
import { useShiki } from "@spotlight/ui/ShikiProvider";
import { SHIKI_DEFAULT_THEME } from "@spotlight/ui/shiki-constants";
import { bundledLanguages } from "shiki/bundle-web.mjs";

export function CodeViewer({ code, lang }: { code: string; lang: string }) {
  const highlighter = useShiki();

  if (code.length === 0) {
    return <></>;
  }

  if (highlighter && lang in bundledLanguages) {
    return (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Need this for shiki
        dangerouslySetInnerHTML={{
          __html: highlighter.codeToHtml(code, {
            lang,
            theme: SHIKI_DEFAULT_THEME,
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
