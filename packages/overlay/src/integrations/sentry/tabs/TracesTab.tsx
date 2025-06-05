import { useCallback, useRef, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useSpotlightContext } from "../../../lib/useSpotlightContext";
import Resizer from "../components/shared/Resizer";
import TraceDetails from "../components/traces/TraceDetails";
import TraceList from "../components/traces/TraceList";
import TraceListFilter from "../components/traces/TraceListFilter";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";
import { useSentryTraces } from "../data/useSentrySpans";
import useTraceFiltering from "../hooks/useTraceFiltering";
import type { Trace } from "../types"; // Ensure Trace type is available

const MIN_PANEL_WIDTH_PERCENT = 20;
const MAX_PANEL_WIDTH_PERCENT = 80;
const DEFAULT_PANEL_WIDTH_PERCENT = 50;

interface TraceSplitViewLayoutProps {
  aiMode: boolean;
  onToggleAIMode: () => void;
  filteredTraces: Trace[];
  allTraces: Trace[];
  visibleTraces: Trace[];
  setShowAll: React.Dispatch<React.SetStateAction<boolean>>;
}

function TraceSplitViewLayout({
  aiMode,
  onToggleAIMode,
  filteredTraces,
  allTraces,
  visibleTraces,
  setShowAll,
}: TraceSplitViewLayoutProps) {
  const { traceId } = useParams<{ traceId: string }>();
  const navigate = useNavigate();
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_PANEL_WIDTH_PERCENT);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftPanelWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    const clampedWidth = Math.max(MIN_PANEL_WIDTH_PERCENT, Math.min(MAX_PANEL_WIDTH_PERCENT, newLeftPanelWidth));
    setLeftPanelWidth(clampedWidth);
  }, []);

  const handleTraceSelect = useCallback(
    (selectedTraceId: string) => {
      if (traceId === selectedTraceId) {
        navigate(".."); // relative to /:traceId/*, so goes to TracesTab
      } else {
        navigate(`../${selectedTraceId}`); // relative to /:traceId/*, so goes to /newTraceId/*
      }
    },
    [navigate, traceId],
  );

  const handleCloseTraceDetails = useCallback(() => {
    navigate(".."); // relative to /:traceId/*, so goes to TracesTab
  }, [navigate]);

  if (!traceId) {
    // safeguard, shouldn't happen if routing is correct
    return <div>Error: Trace ID not found.</div>;
  }

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* left panel - trace list */}
      <div className="flex-shrink-0 overflow-y-auto" style={{ width: `${leftPanelWidth}%` }}>
        <TraceList
          onTraceSelect={handleTraceSelect}
          selectedTraceId={traceId}
          aiMode={aiMode}
          filteredTraces={filteredTraces}
          allTraces={allTraces}
          visibleTraces={visibleTraces}
          setShowAll={setShowAll}
        />
      </div>

      {/* Resizer */}
      <Resizer
        handleResize={handleResize}
        isResizing={isResizing}
        setIsResizing={setIsResizing}
        direction="column"
        className="w-1 flex-shrink-0 cursor-col-resize bg-gray-600 hover:bg-blue-500"
      />

      {/* right panel - selected trace content */}
      <div className="flex-1 overflow-hidden" style={{ width: `${100 - leftPanelWidth}%` }}>
        <TraceDetails traceId={traceId} onClose={handleCloseTraceDetails} aiMode={aiMode} onToggleAI={onToggleAIMode} />
      </div>
    </div>
  );
}

interface TraceListOnlyViewProps {
  aiMode: boolean;
  filteredTraces: Trace[];
  allTraces: Trace[];
  visibleTraces: Trace[];
  setShowAll: React.Dispatch<React.SetStateAction<boolean>>;
}

// Component for showing only the TraceList (for the base route)
function TraceListOnlyView({ aiMode, filteredTraces, allTraces, visibleTraces, setShowAll }: TraceListOnlyViewProps) {
  const navigate = useNavigate();
  const handleTraceSelect = useCallback(
    (traceId: string) => {
      navigate(traceId); // Navigate to /:traceId (relative to current path)
    },
    [navigate],
  );

  return (
    <div className="h-full w-full overflow-y-auto">
      <TraceList
        onTraceSelect={handleTraceSelect}
        selectedTraceId={undefined}
        aiMode={aiMode}
        filteredTraces={filteredTraces}
        allTraces={allTraces}
        visibleTraces={visibleTraces}
        setShowAll={setShowAll}
      />
    </div>
  );
}

export default function TracesTab() {
  const [aiMode, setAiMode] = useState(false);
  const handleToggleAIMode = useCallback(() => {
    setAiMode(prev => !prev);
  }, []);

  const context = useSpotlightContext();
  const { allTraces, localTraces } = useSentryTraces();
  const [showAll, setShowAll] = useState(() => !context.experiments["sentry:focus-local-events"]);
  const visibleTraces = showAll ? allTraces : localTraces;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { TRACE_FILTER_CONFIGS, filteredTraces } = useTraceFiltering(visibleTraces, activeFilters, searchQuery);

  return (
    <SentryEventsContextProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <TraceListFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          filterConfigs={TRACE_FILTER_CONFIGS}
        />
        <div className="flex-1 overflow-auto">
          <Routes>
            {/* Route for when clicking AI flow / messages. This shows that particular ai trace details */}
            <Route
              path="/:traceId/spans/:spanId"
              element={
                <TraceSplitViewLayout
                  aiMode={aiMode}
                  onToggleAIMode={handleToggleAIMode}
                  filteredTraces={filteredTraces}
                  allTraces={allTraces}
                  visibleTraces={visibleTraces}
                  setShowAll={setShowAll}
                />
              }
            />
            <Route
              path="/:traceId/*"
              element={
                <TraceSplitViewLayout
                  aiMode={aiMode}
                  onToggleAIMode={handleToggleAIMode}
                  filteredTraces={filteredTraces}
                  allTraces={allTraces}
                  visibleTraces={visibleTraces}
                  setShowAll={setShowAll}
                />
              }
            />
            <Route
              path="/"
              element={
                <TraceListOnlyView
                  aiMode={aiMode}
                  filteredTraces={filteredTraces}
                  allTraces={allTraces}
                  visibleTraces={visibleTraces}
                  setShowAll={setShowAll}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </SentryEventsContextProvider>
  );
}
