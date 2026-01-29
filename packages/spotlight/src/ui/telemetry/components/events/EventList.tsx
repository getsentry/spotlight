import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import { OriginBadge } from "@spotlight/ui/telemetry/components/shared/OriginBadge";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { Link } from "react-router-dom";
import { useSentryEvents } from "../../data/useSentryEvents";
import { isErrorEvent } from "../../utils/sentry";
import { truncateId } from "../../utils/text";
import EmptyState from "../shared/EmptyState";
import PlatformIcon from "../shared/PlatformIcon";
import { EventSummary } from "./Event";

export default function EventList({ traceId }: { traceId?: string }) {
  const events = useSentryEvents(traceId);

  const matchingEvents = events.filter(isErrorEvent);

  return matchingEvents.length !== 0 ? (
    <CardList>
      {matchingEvents.map(e => {
        return (
          <Link
            className="hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2"
            key={e.event_id}
            to={`/telemetry/errors/${e.event_id}/details`}
          >
            <PlatformIcon event={e} className="text-primary-300 rounded-md" />
            <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
              <div className="flex items-center gap-x-2">
                <div>{truncateId(e.event_id)}</div>
                <OriginBadge sourceType={e.__sourceType} />
              </div>
              <span />
              <TimeSince date={e.timestamp} />
            </div>
            <div className="flex-1 overflow-hidden">
              <EventSummary event={e} />
            </div>
          </Link>
        );
      })}
    </CardList>
  ) : (
    <EmptyState
      variant={!traceId ? "full" : "simple"}
      className={!traceId ? "h-full" : undefined}
      title={!traceId ? "No Errors" : undefined}
      description={
        !traceId
          ? "No errors captured yet. That's either very good news or your SDK isn't set up."
          : "No errors in this trace."
      }
      showDocsLink={!traceId}
    />
  );
}
