import { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Tabs from "~/components/tabs";
import AITraceSplitView from "~/integrations/sentry/components/insights/aiTraces/AITraceSplitView";
import { createTab } from "~/integrations/sentry/utils/tabs";
import { hasAISpans } from "../../insights/aiTraces/sdks/aiLibraries";

import { useSentryEvents } from "~/integrations/sentry/data/useSentryEvents";
import { isLocalTrace } from "~/integrations/sentry/store/helpers";
import type { Trace } from "~/integrations/sentry/types";
import { getFormattedDuration } from "~/integrations/sentry/utils/duration";
import { isErrorEvent } from "~/integrations/sentry/utils/sentry";
import EventContexts from "../../events/EventContexts";
import EventList from "../../events/EventList";
import LogsList from "../../log/LogsList";
import DateTime from "../../shared/DateTime";

type TraceDetailsProps = {
  trace: Trace;
  aiConfig: {
    mode: boolean;
    onToggle: () => void;
  };
};

export function TraceContext({ trace }: { trace: Trace }) {
  return (
    <>
      <div className="space-y-6 p-6">
        <div className="text-primary-300 flex flex-1 items-center gap-x-1">
          <DateTime date={trace.start_timestamp} />
          <span>&mdash;</span>
          <span>
            {/* TODO: Add the duration pill here */}
            <strong>{getFormattedDuration(trace.timestamp - trace.start_timestamp)}</strong> duration
          </span>
        </div>
        <div className="flex-1">
          <div className="border-primary-800 relative h-8 border py-1">
            <div
              className="bg-primary-800 absolute bottom-0 top-0 -m-0.5 flex w-full items-center p-0.5"
              style={{
                left: 0,
                width: "100%",
              }}
            >
              <span className="whitespace-nowrap">{getFormattedDuration(trace.timestamp - trace.start_timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6 py-4">
        <h2 className="mb-2 font-bold uppercase">ID</h2>
        {trace.trace_id}
      </div>
      <EventContexts event={trace.rootTransaction || trace.transactions[0]} />
    </>
  );
}

export default function TraceDetails({ trace, aiConfig }: TraceDetailsProps) {
  const hasAI = trace ? hasAISpans(trace) : false;

  if (!trace) {
    return <p className="text-primary-300 p-6">Trace not found.</p>;
  }

  const events = useSentryEvents(trace.trace_id);
  const errorCount = useMemo(
    () =>
      events.filter(
        e =>
          isErrorEvent(e) && (e.contexts?.trace?.trace_id ? isLocalTrace(e.contexts?.trace?.trace_id) : null) !== false,
      ).length,
    [events],
  );

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

  return (
    <div className="flex h-full flex-col">
      {aiConfig.mode && hasAI ? (
        <AITraceSplitView trace={trace} />
      ) : (
        <>
          <Tabs tabs={tabs} nested />
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <Routes>
              <Route path="context" element={<TraceContext trace={trace} />} />
              <Route path="errors" element={<EventList traceId={trace.trace_id} />} />
              <Route path="logs" element={<LogsList traceId={trace.trace_id} />} />
              <Route path="logs/:id" element={<LogsList traceId={trace.trace_id} />} />
              {/* Default tab */}
              <Route path="*" element={<Navigate to="context" replace />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}
