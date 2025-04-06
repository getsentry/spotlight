import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Span } from '../types';
type SearchContextType = {
  query: string;
  setQuery: (query: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');

  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }

  const matchesQuery = useCallback(
    (span: Span): boolean | undefined =>
      span.span_id.includes(context.query) ||
      span.op?.includes(context.query) ||
      span.description?.includes(context.query),
    [context.query],
  );

  return { ...context, matchesQuery };
}
