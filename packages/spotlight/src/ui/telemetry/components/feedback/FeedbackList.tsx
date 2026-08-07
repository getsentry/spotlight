import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import { OriginBadge } from "@spotlight/ui/telemetry/components/shared/OriginBadge";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { Link } from "react-router-dom";
import { useSentryEvents } from "../../data/useSentryEvents";
import { isFeedbackEvent } from "../../utils/sentry";
import { truncateId } from "../../utils/text";
import EmptyState from "../shared/EmptyState";
import PlatformIcon from "../shared/PlatformIcon";

export default function FeedbackList() {
  const events = useSentryEvents();
  const feedbackEvents = events.filter(isFeedbackEvent);

  if (feedbackEvents.length === 0) {
    return (
      <EmptyState
        variant="full"
        className="h-full"
        title="No Feedback"
        description="No user feedback captured yet. Send feedback with the Sentry SDK's feedbackIntegration to see it here."
        showDocsLink
      />
    );
  }

  return (
    <CardList>
      {feedbackEvents.map(e => {
        const feedback = e.contexts.feedback;
        return (
          <Link
            className="hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2"
            key={e.event_id}
            to={`/telemetry/feedback/${e.event_id}/details`}
          >
            <PlatformIcon event={e} className="text-primary-300 rounded-md" />
            <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
              <div className="flex items-center gap-x-2">
                <div>{truncateId(e.event_id)}</div>
                <OriginBadge sourceType={e.__sourceType} />
              </div>
              <span>{feedback.name || feedback.contact_email || "Anonymous"}</span>
              <TimeSince date={e.timestamp} />
            </div>
            <div className="flex-1 overflow-hidden">
              <strong className="text-primary-100 line-clamp-2 font-mono text-sm">
                {feedback.message || <em>No message</em>}
              </strong>
            </div>
          </Link>
        );
      })}
    </CardList>
  );
}
