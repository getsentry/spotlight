import { Link, Outlet, Route, Routes, useParams } from "react-router-dom";
import useSentryStore from "../../store";
import type { SentryEvent } from "../../types";
import { createTab } from "../../utils/tabs";
import TelemetryTabs from "../TelemetryTabs";
import PlatformIcon from "../shared/PlatformIcon";
import Event, { EventTitle } from "./Event";
import EventBreadcrumbs from "./EventBreadcrumbs";
import EventContexts from "./EventContexts";

function renderEventTitle(event: SentryEvent) {
  return <EventTitle event={event} />;
}

export default function EventDetails() {
  const { eventId } = useParams();
  const getEventById = useSentryStore(state => state.getEventById);

  if (!eventId) {
    return <p className="text-primary-300 p-6">Unknown event id</p>;
  }

  const event = getEventById(eventId);

  if (!event) {
    return <p className="text-primary-300 p-6">Event not found.</p>;
  }

  const tabs = [
    createTab("details", "Details"),
    createTab("breadcrumbs", "Breadcrumbs"),
    createTab("contexts", "Context"),
  ];

  const traceCtx = event.contexts?.trace;
  return (
    <div className="w-full flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="bg-primary-950 flex items-center gap-x-2 px-6 py-4">
        <PlatformIcon event={event} className="rounded-md" />
        <h1 className="max-w-full flex-1 truncate text-2xl">{renderEventTitle(event)}</h1>
        {traceCtx && (
          <div className="text-primary-300 font-mono">
            <div>
              T:{" "}
              <Link className="cursor-pointer underline" to={`/telemetry/traces/${traceCtx.trace_id}`}>
                {traceCtx.trace_id}
              </Link>
            </div>
            <div>
              S:{" "}
              <Link
                className="cursor-pointer underline"
                to={`/telemetry/traces/${traceCtx.trace_id}/spans/${traceCtx.span_id}`}
              >
                {traceCtx.span_id}
              </Link>
            </div>
          </div>
        )}
      </div>
      <TelemetryTabs tabs={tabs} nested />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="breadcrumbs" element={<EventBreadcrumbs event={event} />} />
          <Route path="contexts" element={<EventContexts event={event} />} />
          {/* Default tab */}
          <Route path="*" element={<Event event={event} />} />
        </Routes>
        <Outlet />
      </div>
    </div>
  );
}
