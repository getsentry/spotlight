import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSpotlightContext } from "~/lib/useSpotlightContext";
import { useSentryTraces } from "../data/useSentrySpans";
import { type FilterConfigs, default as useTraceFiltering } from "./useTraceFiltering";

interface TraceData {
  all: ReturnType<typeof useSentryTraces>["allTraces"];
  local: ReturnType<typeof useSentryTraces>["localTraces"];
  filtered: ReturnType<typeof useTraceFiltering>["filteredTraces"];
  visible: ReturnType<typeof useSentryTraces>["allTraces"];
  nonLocalTraceCount: number;
  searchQuery: string;
  activeFilters: string[];
  filterConfigs: FilterConfigs;
  showNonLocalTraces: boolean;
}

interface UseTraceDataReturn extends TraceData {
  setSearchQuery: (query: string) => void;
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  setShowNonLocalTraces: (show: boolean) => void;
  onShowAll: () => void;
}

/**
 * A comprehensive hook that manages all trace-related data and logic
 * including filtering, searching, and visibility control via URL parameters
 */
export function useTraceData(): UseTraceDataReturn {
  const context = useSpotlightContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Get trace data from store
  const { allTraces, localTraces } = useSentryTraces();

  // Parse URL search params
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const showNonLocalTraces =
    searchParams.get("showNonLocalTraces") === "1" || !context.experiments["sentry:focus-local-events"];

  // Local state for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Determine visible traces based on showNonLocalTraces
  const visibleTraces = useMemo(
    () => (showNonLocalTraces ? allTraces : localTraces),
    [showNonLocalTraces, allTraces, localTraces],
  );

  // Apply filtering
  const { TRACE_FILTER_CONFIGS, filteredTraces } = useTraceFiltering(visibleTraces, activeFilters, searchQuery);

  // Calculate non-local trace count
  const nonLocalTraceCount = allTraces.length - localTraces.length;

  // Handler to update showNonLocalTraces in URL
  const setShowNonLocalTraces = useCallback(
    (show: boolean) => {
      const newParams = new URLSearchParams(location.search);
      if (show) {
        newParams.set("showNonLocalTraces", "1");
      } else {
        newParams.delete("showNonLocalTraces");
      }

      // Preserve the current path and update only search params
      const currentPath = location.pathname;
      const newSearch = newParams.toString();
      navigate(currentPath + (newSearch ? `?${newSearch}` : ""), { replace: true });
    },
    [location, navigate],
  );

  // Convenience method to show all traces
  const onShowAll = useCallback(() => {
    setShowNonLocalTraces(true);
  }, [setShowNonLocalTraces]);

  return {
    // Data
    all: allTraces,
    local: localTraces,
    filtered: filteredTraces,
    visible: visibleTraces,
    nonLocalTraceCount,
    searchQuery,
    activeFilters,
    filterConfigs: TRACE_FILTER_CONFIGS,
    showNonLocalTraces,

    // Actions
    setSearchQuery,
    setActiveFilters,
    setShowNonLocalTraces,
    onShowAll,
  };
}
