import { ReactComponent as Sort } from "@spotlight/ui/assets/sort.svg";
import { ReactComponent as SortDown } from "@spotlight/ui/assets/sortDown.svg";
import { cn } from "@spotlight/ui/lib/cn";
import {
  PERFORMANCE_SCORE_PROFILES,
  WEB_VITALS_HEADERS,
  WEB_VITALS_SORT_KEYS,
} from "@spotlight/ui/telemetry/constants";
import { useSentryEvents } from "@spotlight/ui/telemetry/data/useSentryEvents";
import useSort from "@spotlight/ui/telemetry/hooks/useSort";
import type { SentryEventWithPerformanceData } from "@spotlight/ui/telemetry/types";
import { getFormattedDuration } from "@spotlight/ui/telemetry/utils/duration";
import Table from "@spotlight/ui/ui/table";
import { type KeyboardEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { normalizePerformanceScore } from "../../../utils/webVitals";
import EmptyState from "../../shared/EmptyState";

type SentryEventComparator = (a: SentryEventWithPerformanceData, b: SentryEventWithPerformanceData) => number;
type WebVitalsSortTypes = (typeof WEB_VITALS_SORT_KEYS)[keyof typeof WEB_VITALS_SORT_KEYS];
const COMPARATORS: Record<WebVitalsSortTypes, SentryEventComparator> = {
  [WEB_VITALS_SORT_KEYS.pages]: (a, b) => {
    if (a.transaction && b.transaction && a.transaction < b.transaction) return -1;
    if (a.transaction && b.transaction && a.transaction > b.transaction) return 1;
    return 0;
  },
  [WEB_VITALS_SORT_KEYS.lcp]: (a, b) => a.measurements["score.lcp"].value - b.measurements["score.lcp"].value,
  [WEB_VITALS_SORT_KEYS.fid]: (a, b) => a.measurements["score.fid"].value - b.measurements["score.fid"].value,
  [WEB_VITALS_SORT_KEYS.fcp]: (a, b) => a.measurements["score.fcp"].value - b.measurements["score.fcp"].value,
  [WEB_VITALS_SORT_KEYS.cls]: (a, b) => a.measurements["score.cls"].value - b.measurements["score.cls"].value,
  [WEB_VITALS_SORT_KEYS.ttfb]: (a, b) => a.measurements["score.ttfb"].value - b.measurements["score.ttfb"].value,
  [WEB_VITALS_SORT_KEYS.score]: (a, b) => a.measurements["score.total"].value - b.measurements["score.total"].value,
};

const WebVitals = () => {
  const events = useSentryEvents();
  const navigate = useNavigate();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: WEB_VITALS_SORT_KEYS.score });

  const measurementEvents: SentryEventWithPerformanceData[] = useMemo(() => {
    const compareEvents = COMPARATORS[sort.active] || COMPARATORS[WEB_VITALS_SORT_KEYS.score];

    return (
      events
        // TODO: Skipping this check because of not getting all required metrics
        // && !PERFORMANCE_SCORE_PROFILES.profiles[0].scoreComponents.some(c => {
        //   return (
        //     !Object.prototype.hasOwnProperty.call(event.measurements, c.measurement) &&
        //     Math.abs(c.weight) >= Number.EPSILON &&
        //     !c.optional
        //   );
        // })
        .filter(event => event.measurements && event?.contexts?.trace?.op === "pageload")
        .map(event => {
          const updatedEvent = { ...event };
          normalizePerformanceScore(updatedEvent, PERFORMANCE_SCORE_PROFILES);
          return updatedEvent as unknown as SentryEventWithPerformanceData;
        })
        .filter(event => event.measurements["score.total"] != null)
        .sort((a, b) => (sort.asc ? compareEvents(a, b) : compareEvents(b, a)))
    );
  }, [events, sort]);

  const handleRowClick = (measurementEvent: SentryEventWithPerformanceData) => {
    navigate(`/telemetry/insights/webvitals/${measurementEvent.event_id}`);
  };

  const handleRowKeyDown = (
    e: KeyboardEvent<HTMLTableRowElement>,
    measurementEvent: SentryEventWithPerformanceData,
  ) => {
    if (e.key === "Enter") {
      handleRowClick(measurementEvent);
    }
  };

  if (!measurementEvents?.length) {
    return (
      <EmptyState
        variant="full"
        className="h-full"
        title="No Measurements"
        description="Enable Sentry and Spotlight integration in your project to record and view web vitals here."
        showDocsLink
      />
    );
  }
  return (
    <>
      <Table variant="detail">
        <Table.Header>
          <tr>
            {WEB_VITALS_HEADERS.map(header => (
              <th
                key={header.id}
                scope="col"
                className={cn(
                  "text-primary-100 px-6 py-3.5 text-sm font-semibold",
                  header.primary ? "w-2/5" : "w-[15%]",
                )}
              >
                <div
                  className={cn(
                    "flex cursor-pointer select-none items-center gap-1",
                    header.primary ? "justify-start" : "justify-end",
                  )}
                  onClick={() => toggleSortOrder(header.sortKey)}
                >
                  {header.title}
                  {sort.active === header.sortKey ? (
                    <SortDown
                      width={12}
                      height={12}
                      className={cn(
                        "fill-primary-300",
                        sort.asc ? "-translate-y-0.5 rotate-0" : "translate-y-0.5 rotate-180",
                      )}
                    />
                  ) : (
                    <Sort width={12} height={12} className="stroke-primary-300" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </Table.Header>
        <Table.Body>
          {measurementEvents.map(event => (
            <tr
              key={event.event_id}
              className="hover:bg-primary-900 cursor-pointer"
              onClick={() => handleRowClick(event)}
              onKeyDown={e => handleRowKeyDown(e, event)}
              tabIndex={0}
              role="link"
            >
              <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                {event.transaction}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {event.measurements?.lcp ? getFormattedDuration(event.measurements.lcp.value) : "-"}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {event.measurements?.fcp ? getFormattedDuration(event.measurements.fcp.value) : "-"}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {event.measurements?.fid ? getFormattedDuration(event.measurements.fid.value) : "-"}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {event.measurements?.cls ? event.measurements.cls.value : "-"}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {event.measurements?.ttfb ? getFormattedDuration(event.measurements.ttfb.value) : "-"}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {event.measurements["score.total"]?.value
                  ? Math.trunc(event.measurements["score.total"].value * 100)
                  : "-"}
              </td>
            </tr>
          ))}
        </Table.Body>
      </Table>
    </>
  );
};
export default WebVitals;
