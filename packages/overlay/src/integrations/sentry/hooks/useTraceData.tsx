import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSpotlightContext } from "~/lib/useSpotlightContext";
import { useSentryTraces } from "../data/useSentrySpans";
import useTraceFiltering from "./useTraceFiltering";

/**
 * hook that manages all trace-related data and logic
 * including filtering, searching, and visibility control via URL parameters
 */
export function useTraceData() {
  const context = useSpotlightContext();
  const location = useLocation();
  const navigate = useNavigate();

  const { allTraces, localTraces } = useSentryTraces();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const showNonLocalTraces =
    searchParams.has("showNonLocalTraces") || !context.experiments["sentry:focus-local-events"];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const visibleTraces = useMemo(
    () => (showNonLocalTraces ? allTraces : localTraces),
    [showNonLocalTraces, allTraces, localTraces],
  );

  const { TRACE_FILTER_CONFIGS, filteredTraces } = useTraceFiltering(visibleTraces, activeFilters, searchQuery);

  const nonLocalTraceCount = allTraces.length - localTraces.length;

  const setShowNonLocalTraces = useCallback(
    (show: boolean) => {
      const newParams = new URLSearchParams(location.search);
      if (show) {
        newParams.set("showNonLocalTraces", "true");
      } else {
        newParams.delete("showNonLocalTraces");
      }

      const currentPath = location.pathname;
      const newSearch = newParams.toString();
      navigate(currentPath + (newSearch ? `?${newSearch}` : ""), { replace: true });
    },
    [location, navigate],
  );

  const onShowAll = useCallback(() => {
    setShowNonLocalTraces(true);
  }, [setShowNonLocalTraces]);

  return {
    all: allTraces,
    local: localTraces,
    filtered: filteredTraces,
    visible: visibleTraces,
    nonLocalTraceCount,
    searchQuery,
    activeFilters,
    filterConfigs: TRACE_FILTER_CONFIGS,
    showNonLocalTraces,
    setSearchQuery,
    setActiveFilters,
    setShowNonLocalTraces,
    onShowAll,
  };
}
