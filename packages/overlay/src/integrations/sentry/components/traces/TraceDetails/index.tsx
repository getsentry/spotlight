import { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Tabs from "~/components/tabs";
import AITraceSplitView from "~/integrations/sentry/components/insights/aiTraces/AITraceSplitView";
import { createTab } from "~/integrations/sentry/utils/tabs";
import { hasAISpans } from "../../insights/aiTraces/sdks/aiLibraries";

import { useSentryEvents } from "~/integrations/sentry/data/useSentryEvents";
import useSentryStore from "~/integrations/sentry/store";
import { isLocalTrace } from "~/integrations/sentry/store/helpers";
import { isErrorEvent } from "~/integrations/sentry/utils/sentry";
import EventContexts from "../../events/EventContexts";
import EventList from "../../events/EventList";
import LogsList from "../../log/LogsList";

type TraceDetailsProps = {
  traceId: string;
  onClose: () => void;
  aiConfig: {
    mode: boolean;
    onToggle: () => void;
  };
};

export default function TraceDetails({ traceId, aiConfig }: TraceDetailsProps) {
  const events = useSentryEvents(traceId);
  const getTraceById = useSentryStore(state => state.getTraceById);

  const errorCount = useMemo(
    () =>
      events.filter(
        e =>
          isErrorEvent(e) && (e.contexts?.trace?.trace_id ? isLocalTrace(e.contexts?.trace?.trace_id) : null) !== false,
      ).length,
    [events],
  );

  // TODO: Don't use dataCache directly, use a helper like useSentryEvents
  const trace = getTraceById(traceId);
  const hasAI = trace ? hasAISpans(trace) : false;

  if (!traceId) {
    return <p className="text-primary-300 p-6">Unknown trace id</p>;
  }

  if (!trace) {
    return <p className="text-primary-300 p-6">Trace not found.</p>;
  }

  const tabs = [
    createTab("context", "Context"),
    createTab("logs", "Logs"),
    createTab("errors", "Errors", {
      notificationCount: {
        count: errorCount,
        severe: errorCount > 0,
      },
    }),
  ];

  const renderNormalTraceView = () => (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="context" element={<EventContexts event={trace.rootTransaction || trace.transactions[0]} />} />
          <Route path="errors" element={<EventList traceId={traceId} />} />
          <Route path="logs" element={<LogsList traceId={traceId} />} />
          <Route path="logs/:id" element={<LogsList traceId={traceId} />} />
          {/* Default tab */}
          <Route path="*" element={<Navigate to="context" replace />} />
        </Routes>
      </div>
    </>
  );

  const renderAITraceView = () => {
    return <AITraceSplitView traceId={traceId} />;
  };

  return (
    <div className="flex h-full flex-col">{aiConfig.mode && hasAI ? renderAITraceView() : renderNormalTraceView()}</div>
  );
}
