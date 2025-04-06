import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Span } from '../types';
type SearchContextType = {
  query: string;
  setQuery: (query: string) => void;
  showOnlyMatched: boolean;
  setShowOnlyMatched: (showOnlyMatched: boolean) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [showOnlyMatched, setShowOnlyMatched] = useState(false);

  return (
    <SearchContext.Provider value={{ query, setQuery, showOnlyMatched, setShowOnlyMatched }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }

  const matchesQuery = useCallback(
    (span: Span): boolean => {
      const q = context.query.toLowerCase();
      return (
        (span.span_id.toLowerCase().includes(q) ||
          span.op?.toLowerCase().includes(q) ||
          span.description?.toLowerCase().includes(q)) ??
        false
      );
    },
    [context.query],
  );

  return { ...context, matchesQuery };
}
