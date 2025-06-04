import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { createTab } from "~/integrations/sentry/utils/tabs";

import Tabs from "~/components/tabs";
import { useSentryEvents } from "~/integrations/sentry/data/useSentryEvents";
import useSentryStore from "~/integrations/sentry/store";
import { isLocalTrace } from "~/integrations/sentry/store/helpers";
import { isErrorEvent } from "~/integrations/sentry/utils/sentry";
import EventContexts from "../../events/EventContexts";
import EventList from "../../events/EventList";
import LogsList from "../../log/LogsList";
import TraceDetailHeader from "./components/TraceDetailHeader";
import TraceTreeview from "./components/TraceTreeview";

export default function TraceDetails() {
  const { traceId } = useParams();
  const events = useSentryEvents(traceId);
  const getTraceById = useSentryStore(state => state.getTraceById);

  if (!traceId) {
    return <p className="text-primary-300 p-6">Unknown trace id</p>;
  }

  // TODO: Don't use dataCache directly, use a helper like useSentryEvents
  const trace = getTraceById(traceId);

  if (!trace) {
    return (
      <p className="text-primary-300 p-6">
        Trace not found. Check for more{" "}
        <Link to="/traces" className="underline">
          traces
        </Link>
      </p>
    );
  }

  const errorCount = events.filter(
    e => isErrorEvent(e) && (e.contexts?.trace?.trace_id ? isLocalTrace(e.contexts?.trace?.trace_id) : null) !== false,
  ).length;

  const tabs = [
    createTab("details", "Details"),
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
    <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <TraceDetailHeader trace={trace} />
      <Tabs tabs={tabs} nested />
      <Routes>
        <Route path="details" element={<TraceTreeview traceId={traceId} />} />
        <Route path="spans/:spanId" element={<TraceTreeview traceId={traceId} />} />
        <Route path="context" element={<EventContexts event={trace.rootTransaction || trace.transactions[0]} />} />
        <Route path="errors" element={<EventList traceId={traceId} />} />
        <Route path="logs" element={<LogsList traceId={traceId} />} />
        <Route path="logs/:id" element={<LogsList traceId={traceId} />} />
        {/* Default tab */}
        <Route path="*" element={<Navigate to={`/traces/${traceId}/details`} replace />} />
      </Routes>
    </div>
  );
}
