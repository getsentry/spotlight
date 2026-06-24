import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import { OriginBadge } from "@spotlight/ui/telemetry/components/shared/OriginBadge";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSentryEvents } from "../../data/useSentryEvents";
import useErrorFiltering from "../../hooks/useErrorFiltering";
import { isErrorEvent } from "../../utils/sentry";
import { truncateId } from "../../utils/text";
import EmptyState from "../shared/EmptyState";
import ListFilter from "../shared/ListFilter";
import PlatformIcon from "../shared/PlatformIcon";
import { EventSummary } from "./Event";

export default function EventList({ traceId }: { traceId?: string }) {
  const events = useSentryEvents(traceId);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const errorEvents = events.filter(isErrorEvent);
  const { ERROR_FILTER_CONFIGS, filteredEvents } = useErrorFiltering(errorEvents, activeFilters, searchQuery);

  // Filtering is only exposed on the top-level Errors tab, not inside a trace's error list.
  const showFilter = !traceId && errorEvents.length > 0;
  const matchingEvents = traceId ? errorEvents : filteredEvents;

  const list =
    matchingEvents.length !== 0 ? (
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
            ? showFilter
              ? "No errors match the current filters."
              : "No errors captured yet. That's either very good news or your SDK isn't set up."
            : "No errors in this trace."
        }
        showDocsLink={!traceId && !showFilter}
      />
    );

  if (!showFilter) {
    return list;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ListFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        filterConfigs={ERROR_FILTER_CONFIGS}
        searchPlaceholder="Search by message or exception type..."
      />
      <div className="flex-1 overflow-auto">{list}</div>
    </div>
  );
}
