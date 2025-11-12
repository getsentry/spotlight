import { type PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { type Highlighter, bundledLanguages, createHighlighter } from "shiki/bundle-web.mjs";
import { SHIKI_DEFAULT_THEME } from "./shiki-constants";

const ShikiContext = createContext<Highlighter | null>(null);

export function ShikiProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState<Highlighter | null>(null);

  useEffect(() => {
    createHighlighter({
      themes: [SHIKI_DEFAULT_THEME],
      langs: Object.keys(bundledLanguages),
    }).then(setValue);
  }, []);

  return <ShikiContext.Provider value={value}>{children}</ShikiContext.Provider>;
}

export function useShiki() {
  const context = useContext(ShikiContext);

  return context;
}
