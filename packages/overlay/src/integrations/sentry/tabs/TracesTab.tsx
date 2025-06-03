import { useCallback, useRef, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import Resizer from "../components/shared/Resizer";
import TraceDetails from "../components/traces/TraceDetails";
import TraceList from "../components/traces/TraceList";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";

const MIN_PANEL_WIDTH_PERCENT = 20;
const MAX_PANEL_WIDTH_PERCENT = 80;
const DEFAULT_PANEL_WIDTH_PERCENT = 50;

// TraceList on left, TraceDetails on right
function TraceSplitViewLayout() {
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
        <TraceList onTraceSelect={handleTraceSelect} selectedTraceId={traceId} />
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
        <TraceDetails traceId={traceId} onClose={handleCloseTraceDetails} />
      </div>
    </div>
  );
}

// Component for showing only the TraceList (for the base route)
function TraceListOnlyView() {
  const navigate = useNavigate();

  const handleTraceSelect = useCallback(
    (traceId: string) => {
      navigate(traceId); // Navigate to /:traceId (relative to current path)
    },
    [navigate],
  );

  return (
    <div className="h-full w-full overflow-y-auto">
      <TraceList onTraceSelect={handleTraceSelect} selectedTraceId={undefined} />
    </div>
  );
}

export default function TracesTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/:traceId/*" element={<TraceSplitViewLayout />} />
        <Route path="/" element={<TraceListOnlyView />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
