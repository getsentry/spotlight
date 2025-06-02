import { useState } from "react";
import { Link } from "react-router-dom";
import { useSpotlightContext } from "~/lib/useSpotlightContext";
import { Badge } from "~/ui/badge";
import CardList from "../../../../components/CardList";
import TimeSince from "../../../../components/TimeSince";
import { useSentryEvents } from "../../data/useSentryEvents";
import { isLocalTrace } from "../../store/helpers";
import { isErrorEvent } from "../../utils/sentry";
import { truncateId } from "../../utils/text";
import HiddenItemsButton from "../shared/HiddenItemsButton";
import PlatformIcon from "../shared/PlatformIcon";
import { EventSummary } from "./Event";

export default function EventList({ traceId }: { traceId?: string }) {
  const events = useSentryEvents(traceId);
  const context = useSpotlightContext();

  const matchingEvents = events.filter(isErrorEvent);

  const [showAll, setShowAll] = useState(!context.experiments["sentry:focus-local-events"]);
  const filteredEvents = showAll
    ? matchingEvents
    : matchingEvents.filter(
        e => (e.contexts?.trace?.trace_id ? isLocalTrace(e.contexts?.trace?.trace_id) : null) !== false,
      );
  const hiddenItemCount = matchingEvents.length - filteredEvents.length;

  return matchingEvents.length !== 0 ? (
    <CardList>
      {hiddenItemCount > 0 && (
        <HiddenItemsButton
          itemCount={hiddenItemCount}
          onClick={() => {
            setShowAll(true);
          }}
        />
      )}
      {filteredEvents.map(e => {
        const traceId = e.contexts?.trace?.trace_id;
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
                {traceId && isLocalTrace(traceId) ? (
                  <Badge title="This event is part of your local session.">Local</Badge>
                ) : null}
              </div>
              <span />
              <TimeSince date={e.timestamp} />
            </div>
            <div className="flex-1">
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
