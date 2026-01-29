import { createTab } from "@spotlight/ui/telemetry/utils/tabs";
import { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import TelemetryTabs from "../../TelemetryTabs";

import { useSentryEvents } from "@spotlight/ui/telemetry/data/useSentryEvents";
import useSentryStore from "@spotlight/ui/telemetry/store/store";
import type { Trace } from "@spotlight/ui/telemetry/types";
import { getFormattedDuration } from "@spotlight/ui/telemetry/utils/duration";
import { isErrorEvent } from "@spotlight/ui/telemetry/utils/sentry";
import EventContexts from "../../events/EventContexts";
import EventList from "../../events/EventList";
import AITraceSplitView from "../../insights/aiTraces/AITraceSplitView";
import { hasAISpans } from "../../insights/aiTraces/sdks/aiLibraries";
import LogsList from "../../log/LogsList";
import MetricsList from "../../metrics/MetricsList";
import DateTime from "../../shared/DateTime";
import EmptyState from "../../shared/EmptyState";
import TraceProfileTree from "./components/TraceProfileTree";

type TraceDetailsProps = {
  trace: Trace;
  aiConfig: {
    mode: boolean;
    onToggle: () => void;
  };
};

export function TraceContext({ trace }: { trace: Trace }) {
  const rootTransaction = trace.rootTransaction || trace.transactions[0];
  const events = useSentryEvents(trace.trace_id);

  const traceEvent = useMemo(() => {
    const allAttachments = events
      .filter(e => e.attachments && e.attachments.length > 0)
      .flatMap(e => e.attachments || []);

    const baseEvent = rootTransaction || events.find(e => e.contexts) || events[0];

    if (!baseEvent) return null;

    // we want to show all attachments from the trace
    return {
      ...baseEvent,
      attachments: allAttachments.length > 0 ? allAttachments : baseEvent.attachments,
    };
  }, [events, rootTransaction]);

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
      {traceEvent && <EventContexts event={traceEvent} />}
    </>
  );
}

export default function TraceDetails({ trace, aiConfig }: TraceDetailsProps) {
  const hasAI = trace ? hasAISpans(trace) : false;

  if (!trace) {
    return <EmptyState description="Trace not found." />;
  }

  const events = useSentryEvents(trace.trace_id);
  const profile = useSentryStore.getState().getProfileByTraceId(trace.trace_id);
  const getMetricsByTraceId = useSentryStore.getState().getMetricsByTraceId;
  const metrics = getMetricsByTraceId(trace.trace_id);
  const errorCount = useMemo(() => events.reduce((len, e) => (isErrorEvent(e) ? len + 1 : len), 0), [events]);

  const tabs = [
    createTab("context", "Context"),
    createTab("logs", "Logs"),
    createTab("errors", "Errors", {
      notificationCount: {
        count: errorCount,
        severe: errorCount > 0,
      },
    }),
    createTab("metrics", "Metrics", {
      notificationCount: {
        count: metrics.length,
      },
    }),
  ];

  if (profile) {
    tabs.push(createTab("profileTree", "Profile"));
  }

  return (
    <div className="flex h-full flex-col">
      {aiConfig.mode && hasAI ? (
        <AITraceSplitView trace={trace} />
      ) : (
        <>
          <TelemetryTabs tabs={tabs} nested />
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <Routes>
              <Route path="context" element={<TraceContext trace={trace} />} />
              <Route path="errors" element={<EventList traceId={trace.trace_id} />} />
              <Route path="logs" element={<LogsList traceId={trace.trace_id} />} />
              <Route path="logs/:id" element={<LogsList traceId={trace.trace_id} />} />
              <Route path="metrics" element={<MetricsList traceId={trace.trace_id} />} />
              <Route path="metrics/:metricId/*" element={<MetricsList traceId={trace.trace_id} />} />
              {profile && <Route path="profileTree" element={<TraceProfileTree profile={profile} />} />}
              {/* Default tab */}
              <Route path="*" element={<Navigate to="context" replace />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}
