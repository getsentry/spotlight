import { Link, useParams } from "react-router-dom";
import { TELEMETRY_BASE_URL } from "../../constants";
import useSentryStore from "../../store";
import { isFeedbackEvent } from "../../utils/sentry";
import EmptyState from "../shared/EmptyState";
import PlatformIcon from "../shared/PlatformIcon";

export default function FeedbackDetails() {
  const { eventId } = useParams();
  const getEventById = useSentryStore(state => state.getEventById);

  if (!eventId) {
    return <EmptyState description="Unknown event id." />;
  }

  const event = getEventById(eventId);

  if (!event || !isFeedbackEvent(event)) {
    return <EmptyState description="Feedback not found." />;
  }

  const feedback = event.contexts.feedback;
  const traceCtx = event.contexts.trace;
  const associatedEventId = feedback.associated_event_id;

  return (
    <div className="w-full flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="bg-primary-950 flex items-center gap-x-2 px-6 py-4">
        <PlatformIcon event={event} className="rounded-md" />
        <h1 className="max-w-full flex-1 truncate text-2xl">
          {feedback.name || feedback.contact_email || "User Feedback"}
        </h1>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-y-6 overflow-y-auto overflow-x-hidden px-6 py-4 font-mono">
        <div>
          <strong className="text-primary-300 text-sm uppercase">Message</strong>
          <pre className="text-primary-100 whitespace-pre-wrap">{feedback.message || "—"}</pre>
        </div>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          {feedback.name && (
            <>
              <dt className="text-primary-300">Name</dt>
              <dd className="text-primary-100">{feedback.name}</dd>
            </>
          )}
          {feedback.contact_email && (
            <>
              <dt className="text-primary-300">Email</dt>
              <dd className="text-primary-100">{feedback.contact_email}</dd>
            </>
          )}
          {feedback.url && (
            <>
              <dt className="text-primary-300">URL</dt>
              <dd className="text-primary-100 truncate">{feedback.url}</dd>
            </>
          )}
          {feedback.source && (
            <>
              <dt className="text-primary-300">Source</dt>
              <dd className="text-primary-100">{feedback.source}</dd>
            </>
          )}
          {associatedEventId && (
            <>
              <dt className="text-primary-300">Associated Event</dt>
              <dd>
                <Link
                  className="cursor-pointer underline"
                  to={`${TELEMETRY_BASE_URL}/errors/${associatedEventId}/details`}
                >
                  {associatedEventId}
                </Link>
              </dd>
            </>
          )}
          {traceCtx?.trace_id && (
            <>
              <dt className="text-primary-300">Trace</dt>
              <dd>
                <Link className="cursor-pointer underline" to={`${TELEMETRY_BASE_URL}/traces/${traceCtx.trace_id}`}>
                  {traceCtx.trace_id}
                </Link>
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
