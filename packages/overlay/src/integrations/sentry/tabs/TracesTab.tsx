import { useCallback, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import classNames from "~/lib/classNames";
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
import { useTraceData } from "../hooks/useTraceData";
import type { Span, Trace, TraceListData } from "../types"; // Ensure Trace type is available

const MIN_PANEL_WIDTH_PERCENT = 20;
const MAX_PANEL_WIDTH_PERCENT = 80;
const DEFAULT_PANEL_WIDTH_PERCENT = 50;

interface TraceSplitViewLayoutProps {
  trace: Trace;
  span?: Span | null;
  aiConfig: {
    mode: boolean;
    onToggle: () => void;
  };
}

export function AITraceToggle({ trace, aiConfig }: { trace: Trace; aiConfig: TraceSplitViewLayoutProps["aiConfig"] }) {
  if (!hasAISpans(trace)) {
    return null;
  }

  return (
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
  );
}

export function TraceSplitViewLayout({ trace, span, aiConfig }: TraceSplitViewLayoutProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_PANEL_WIDTH_PERCENT);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftPanelWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    const clampedWidth = Math.max(MIN_PANEL_WIDTH_PERCENT, Math.min(MAX_PANEL_WIDTH_PERCENT, newLeftPanelWidth));
    setLeftPanelWidth(clampedWidth);
  }, []);

  if (!trace) {
    return <div className="text-primary-300 p-6">Trace not found. 🤔</div>;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden ">
      {trace ? (
        <div className="border-b-primary-700 bg-primary-900 border-b transition-colors duration-150">
          <div className="flex items-center bg-primary-800">
            <div className="flex-1">
              <TraceItem trace={trace} className="hover:bg-transparent" />
            </div>

            {/* AI Mode Toggle */}
            <AITraceToggle trace={trace} aiConfig={aiConfig} />
          </div>
        </div>
      ) : null}

      {/* split panel below */}
      <div ref={containerRef} className="flex h-full w-full flex-1 overflow-hidden">
        {/* left panel - vertically split: tree/transcription + trace list */}
        <div
          ref={leftPanelRef}
          className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Top part of left panel -> TreeView/AITranscription */}
          {trace && (
            <div className="border-b-primary-700 bg-primary-950 border-b flex-shrink-0">
              {aiConfig.mode && hasAISpans(trace) ? (
                <AITranscription />
              ) : (
                <div className="px-2">
                  <TraceTreeview traceId={trace.trace_id} />
                </div>
              )}
            </div>
          )}
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
          {span && !aiConfig.mode ? <SpanDetails span={span} /> : <TraceDetails trace={trace} aiConfig={aiConfig} />}
        </div>
      </div>
    </div>
  );
}

export default function TracesTab() {
  const traceData = useTraceData();

  const traceDataForList: TraceListData = {
    filtered: traceData.filtered,
    all: traceData.all,
    visible: traceData.visible,
    nonLocalTraceCount: traceData.nonLocalTraceCount,
  };

  return (
    <SentryEventsContextProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <TraceListFilter
          searchQuery={traceData.searchQuery}
          setSearchQuery={traceData.setSearchQuery}
          activeFilters={traceData.activeFilters}
          setActiveFilters={traceData.setActiveFilters}
          filterConfigs={traceData.filterConfigs}
        />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route
              path="/:traceId/spans/:spanId/*"
              element={<TraceList traceData={traceDataForList} onShowAll={traceData.onShowAll} />}
            />
            <Route
              path="/:traceId/spans/:spanId"
              element={<TraceList traceData={traceDataForList} onShowAll={traceData.onShowAll} />}
            />
            <Route
              path="/:traceId/*"
              element={<TraceList traceData={traceDataForList} onShowAll={traceData.onShowAll} />}
            />
            <Route path="/" element={<TraceList traceData={traceDataForList} onShowAll={traceData.onShowAll} />} />
          </Routes>
        </div>
      </div>
    </SentryEventsContextProvider>
  );
}
