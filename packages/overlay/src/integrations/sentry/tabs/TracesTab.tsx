import { useCallback, useEffect, useRef, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import classNames from "~/lib/classNames";
import { useSpotlightContext } from "../../../lib/useSpotlightContext";
import AITranscription from "../components/insights/aiTraces/AITranscription";
import { hasAISpans } from "../components/insights/aiTraces/sdks/aiLibraries";
import Resizer from "../components/shared/Resizer";
import TraceDetails from "../components/traces/TraceDetails";
import TraceTreeview from "../components/traces/TraceDetails/components/TraceTreeview";
import TraceItem from "../components/traces/TraceItem";
import TraceList from "../components/traces/TraceList";
import TraceListFilter from "../components/traces/TraceListFilter";
import SpanDetails from "../components/traces/spans/SpanDetails";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";
import { useSentryTraces } from "../data/useSentrySpans";
import useTraceFiltering from "../hooks/useTraceFiltering";
import useSentryStore from "../store";
import type { Trace } from "../types"; // Ensure Trace type is available

const MIN_PANEL_WIDTH_PERCENT = 20;
const MAX_PANEL_WIDTH_PERCENT = 80;
const DEFAULT_PANEL_WIDTH_PERCENT = 50;

interface TraceSplitViewLayoutProps {
  traceData: {
    filtered: Trace[];
    all: Trace[];
    visible: Trace[];
    hiddenItemCount: number;
  };
  aiConfig: {
    mode: boolean;
    onToggle: () => void;
  };
  onShowAll: () => void;
}

function TraceSplitViewLayout({ traceData, aiConfig, onShowAll }: TraceSplitViewLayoutProps) {
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const navigate = useNavigate();
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_PANEL_WIDTH_PERCENT);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const getTraceById = useSentryStore(state => state.getTraceById);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftPanelWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    const clampedWidth = Math.max(MIN_PANEL_WIDTH_PERCENT, Math.min(MAX_PANEL_WIDTH_PERCENT, newLeftPanelWidth));
    setLeftPanelWidth(clampedWidth);
  }, []);

  const handleCloseTraceDetails = useCallback(() => {
    navigate(".."); // relative to /:traceId/*, so goes to TracesTab
  }, [navigate]);

  // Scroll to top when trace changes
  useEffect(() => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = 0;
    }
  }, [traceId]);

  if (!traceId) {
    // safeguard, shouldn't happen if routing is correct
    return <div>Error: Trace ID not found.</div>;
  }

  const selectedTrace = getTraceById(traceId);
  const isAITrace = selectedTrace ? hasAISpans(selectedTrace) : false;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden ">
      {/* selected trace item at the top */}
      {selectedTrace && (
        <div className="border-b-primary-700 bg-primary-900 border-b transition-colors duration-150">
          <div className="flex items-center bg-primary-800">
            <div className="flex-1">
              <TraceItem trace={selectedTrace} isSelected={true} className="hover:bg-transparent" />
            </div>

            {/* AI Mode Toggle */}
            {isAITrace && (
              <div className="flex items-center px-8">
                <span
                  id="ai-mode-label"
                  className="text-primary-200 mr-3 text-sm font-medium cursor-pointer"
                  onClick={aiConfig.onToggle}
                >
                  AI Mode
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={aiConfig.mode}
                  aria-labelledby="ai-mode-label"
                  onClick={aiConfig.onToggle}
                  className={classNames(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                    aiConfig.mode ? "bg-blue-500 focus:ring-blue-400" : "bg-primary-700 focus:ring-primary-600",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={classNames(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      aiConfig.mode ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* split panel below */}
      <div ref={containerRef} className="flex h-full w-full flex-1 overflow-hidden">
        {/* left panel - vertically split: tree/transcription + trace list */}
        <div
          ref={leftPanelRef}
          className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Top part of left panel -> TreeView/AITranscription */}
          {selectedTrace && (
            <div className="border-b-primary-700 bg-primary-950 border-b flex-shrink-0">
              {aiConfig.mode && isAITrace ? (
                <AITranscription traceId={traceId} />
              ) : (
                <div className="px-2">
                  <TraceTreeview traceId={traceId} />
                </div>
              )}
            </div>
          )}

          {/* Bottom part of left panel: Trace List */}
          <div className="flex-shrink-0">
            <TraceList
              traceData={traceData}
              displayConfig={{
                aiMode: aiConfig.mode,
                hideSelectedInline: true,
              }}
              onShowAll={onShowAll}
            />
          </div>
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
          {spanId && !aiConfig.mode ? (
            <SpanDetails traceId={traceId} spanId={spanId} />
          ) : (
            <TraceDetails traceId={traceId} onClose={handleCloseTraceDetails} aiConfig={aiConfig} />
          )}
        </div>
      </div>
    </div>
  );
}

interface TraceListOnlyViewProps {
  aiMode: boolean;
  traceData: {
    filtered: Trace[];
    all: Trace[];
    visible: Trace[];
    hiddenItemCount: number;
  };
  onShowAll: () => void;
}

function TraceListOnlyView({ aiMode, traceData, onShowAll }: TraceListOnlyViewProps) {
  return (
    <div className="h-full w-full overflow-y-auto">
      <TraceList
        traceData={traceData}
        displayConfig={{
          aiMode: aiMode,
          hideSelectedInline: false,
        }}
        onShowAll={onShowAll}
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
  const hiddenItemCount = allTraces.length - visibleTraces.length;

  const traceData = {
    filtered: filteredTraces,
    all: allTraces,
    visible: visibleTraces,
    hiddenItemCount: hiddenItemCount,
  };

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
                  traceData={traceData}
                  aiConfig={{
                    mode: aiMode,
                    onToggle: handleToggleAIMode,
                  }}
                  onShowAll={() => setShowAll(true)}
                />
              }
            />
            <Route
              path="/:traceId/*"
              element={
                <TraceSplitViewLayout
                  traceData={traceData}
                  aiConfig={{
                    mode: aiMode,
                    onToggle: handleToggleAIMode,
                  }}
                  onShowAll={() => setShowAll(true)}
                />
              }
            />
            <Route
              path="/"
              element={<TraceListOnlyView aiMode={aiMode} traceData={traceData} onShowAll={() => setShowAll(true)} />}
            />
            <Route
              path="/:traceId/spans/:spanId/*"
              element={
                <TraceSplitViewLayout
                  traceData={traceData}
                  aiConfig={{
                    mode: aiMode,
                    onToggle: handleToggleAIMode,
                  }}
                  onShowAll={() => setShowAll(true)}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </SentryEventsContextProvider>
  );
}
