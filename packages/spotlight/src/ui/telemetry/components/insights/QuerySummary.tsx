import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ReactComponent as Sort } from "@spotlight/ui/assets/sort.svg";
import { ReactComponent as SortDown } from "@spotlight/ui/assets/sortDown.svg";
import { cn } from "@spotlight/ui/lib/cn";
import Breadcrumbs from "@spotlight/ui/ui/breadcrumbs";
import Table from "@spotlight/ui/ui/table";
import { QUERY_SUMMARY_HEADERS, QUERY_SUMMARY_SORT_KEYS } from "../../constants";
import { useSentrySpans } from "../../data/useSentrySpans";
import useSort from "../../hooks/useSort";
import type { Span } from "../../types";
import { getFormattedDuration, getSpanDurationClassName } from "../../utils/duration";
import { truncateId } from "../../utils/text";
import { TimeBar } from "../shared/TimeBar";

type SpanInfoComparator = (a: Span, b: Span) => number;
type QuerySummarySortTypes = (typeof QUERY_SUMMARY_SORT_KEYS)[keyof typeof QUERY_SUMMARY_SORT_KEYS];
const COMPARATORS: Record<QuerySummarySortTypes, SpanInfoComparator> = {
  [QUERY_SUMMARY_SORT_KEYS.foundIn]: (a, b) => {
    const aTrace = a.trace_id || "";
    const bTrace = b.trace_id || "";
    if (aTrace < bTrace) return -1;
    if (aTrace > bTrace) return 1;
    return 0;
  },
  [QUERY_SUMMARY_SORT_KEYS.spanId]: (a, b) => {
    if (a.span_id < b.span_id) return -1;
    if (a.span_id > b.span_id) return 1;
    return 0;
  },
  [QUERY_SUMMARY_SORT_KEYS.totalTime]: (a, b) => a.timestamp - a.start_timestamp - (b.timestamp - b.start_timestamp),
};

const QuerySummary = () => {
  const allSpans = useSentrySpans();
  const { type } = useParams();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: QUERY_SUMMARY_SORT_KEYS.totalTime });

  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/atob
  const decodedType = type && atob(type);

  const filteredDBSpans: Span[] = useMemo(() => {
    if (!decodedType) {
      return [];
    }
    const spans = allSpans;
    const compareSpanInfo = COMPARATORS[sort.active] || COMPARATORS[QUERY_SUMMARY_SORT_KEYS.totalTime];

    return spans
      .filter(span => span.description === decodedType)
      .sort((a, b) => (sort.asc ? compareSpanInfo(a, b) : compareSpanInfo(b, a)));
  }, [allSpans, sort, decodedType]);

  if (!filteredDBSpans || !filteredDBSpans.length) {
    return <p className="text-primary-300 px-6 py-4">Query not found.</p>;
  }

  const maxTime = Math.max(...filteredDBSpans.map(dbSpan => dbSpan.timestamp - dbSpan.start_timestamp));

  return (
    <>
      <Breadcrumbs
        crumbs={[
          {
            id: "queries",
            label: "Queries",
            link: true,
            to: "/insights/queries",
          },
          {
            id: "querySummary",
            label: "Query Summary",
            link: false,
          },
        ]}
      />
      <div className="border-b-primary-700 bg-primary-950 flex items-center gap-x-2 border-b px-6 py-4">
        <h1 className="flex w-full flex-1 items-center text-xl">{decodedType}</h1>
      </div>
      <Table variant="detail">
        <Table.Header>
          <tr>
            {QUERY_SUMMARY_HEADERS.map(header => (
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
          {filteredDBSpans.map(span => (
            <tr key={span.span_id} className="hover:bg-primary-900">
              <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                <TimeBar
                  value={span.timestamp - span.start_timestamp}
                  maxValue={maxTime}
                  title={span.trace_id}
                  className="text-lime-500"
                >
                  <Link className="truncate hover:underline" to={`/telemetry/traces/${span.trace_id}`}>
                    {truncateId(span.trace_id)}
                  </Link>
                </TimeBar>
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <span className={getSpanDurationClassName(span.timestamp - span.start_timestamp)}>
                  {getFormattedDuration(span.timestamp - span.start_timestamp)}
                </span>
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link
                  className="truncate hover:underline"
                  to={`/telemetry/traces/${span.trace_id}/spans/${span.span_id}`}
                >
                  {truncateId(span.span_id)}
                </Link>
              </td>
            </tr>
          ))}
        </Table.Body>
      </Table>
    </>
  );
};

export default QuerySummary;
