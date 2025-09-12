import { Link } from "react-router-dom";
import CardList from "~/telemetry/components/shared/CardList";
import TimeSince from "~/telemetry/components/shared/TimeSince";
import { useSentryEvents } from "../../data/useSentryEvents";
import { isErrorEvent } from "../../utils/sentry";
import { truncateId } from "../../utils/text";
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
            to={`/errors/${e.event_id}/details`}
          >
            <PlatformIcon event={e} className="text-primary-300 rounded-md" />
            <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
              <div className="flex items-center gap-x-2">
                <div>{truncateId(e.event_id)}</div>
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
    <div className="text-primary-300 p-6">Looks like there's no events recorded matching this query. 🤔</div>
  );
}
