import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as Sort } from "~/assets/sort.svg";
import { ReactComponent as SortDown } from "~/assets/sortDown.svg";
import { cn } from "~/lib/cn";
import { TimeBar } from "~/telemetry/components/shared/TimeBar";
import { DB_SPAN_REGEX, QUERIES_HEADERS, QUERIES_SORT_KEYS } from "~/telemetry/constants";
import { useSentrySpans } from "~/telemetry/data/useSentrySpans";
import useSort from "~/telemetry/hooks/useSort";
import type { Span } from "~/telemetry/types";
import { getFormattedDuration, getSpanDurationClassName } from "~/telemetry/utils/duration";
import Table from "~/ui/table";

type QueryInfo = {
  avgDuration: number;
  totalTime: number;
  description: string;
};
type QueryInfoComparator = (a: QueryInfo, b: QueryInfo) => number;
type QuerySortTypes = (typeof QUERIES_SORT_KEYS)[keyof typeof QUERIES_SORT_KEYS];

const COMPARATORS: Record<QuerySortTypes, QueryInfoComparator> = {
  [QUERIES_SORT_KEYS.queryDesc]: (a, b) => {
    if (a.description < b.description) return -1;
    if (a.description > b.description) return 1;
    return 0;
  },
  [QUERIES_SORT_KEYS.avgDuration]: (a, b) => a.avgDuration - b.avgDuration,
  [QUERIES_SORT_KEYS.totalTime]: (a, b) => a.totalTime - b.totalTime,
};

const calculateQueryInfo = ({ query, spanData }: { query: string; spanData: Span[] }): QueryInfo => {
  const queryTypeData = spanData.filter((span: Span) => span.description === query);
  const times = queryTypeData.map((span: Span) => span.timestamp - span.start_timestamp);
  const totalTimeInMs = times.reduce((acc: number, time: number) => acc + time, 0);
  const avgDuration = totalTimeInMs / times.length;

  return {
    avgDuration,
    totalTime: totalTimeInMs,
    description: query,
  };
};

const Queries = ({ showAll }: { showAll: boolean }) => {
  const navigate = useNavigate();
  const { allSpans, localSpans } = useSentrySpans();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: QUERIES_SORT_KEYS.totalTime });

  const queriesData: QueryInfo[] = useMemo(() => {
    const compareQueryInfo = COMPARATORS[sort.active] || COMPARATORS[QUERIES_SORT_KEYS.totalTime];
    const spans = showAll ? allSpans : localSpans;
    const onlyDBSpans = spans.filter((span: Span) => DB_SPAN_REGEX.test(span.op || ""));
    const uniqueSpansSet = new Set(onlyDBSpans.map(span => String(span?.description).trim()));
    // Clear out empty ones (they collapse as a single empty string since this is a set)
    uniqueSpansSet.delete("");
    return [...uniqueSpansSet]
      .map(query => calculateQueryInfo({ query, spanData: onlyDBSpans }))
      .sort((a, b) => (sort.asc ? compareQueryInfo(a, b) : compareQueryInfo(b, a)));
  }, [allSpans, localSpans, showAll, sort]);

  const maxTime = Math.max(...queriesData.map(query => query.totalTime));

  const handleRowClick = (query: QueryInfo) => {
    navigate(`/insights/queries/${btoa(query.description)}`);
  };

  if (!queriesData?.length) {
    return (
      <p className="text-primary-300 px-6 py-4">
        No Database queries found. Add integration in Sentry initialization to track Database queries.
      </p>
    );
  }

  return (
    <Table variant="detail">
      <Table.Header>
        <tr>
          {QUERIES_HEADERS.map(header => (
            <th
              key={header.id}
              scope="col"
              className={cn(
                "text-primary-100 select-none px-6 py-3.5 text-sm font-semibold",
                header.primary ? "w-2/5" : "w-[15%]",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex cursor-pointer items-center gap-1",
                  header.primary ? "justify-start" : "justify-end",
                )}
                onClick={() => toggleSortOrder(header.sortKey)}
                tabIndex={0}
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
              </button>
            </th>
          ))}
        </tr>
      </Table.Header>
      <Table.Body>
        {queriesData.map(query => (
          <tr
            key={query.description}
            onClick={() => handleRowClick(query)}
            tabIndex={0}
            role="link"
            className="hover:bg-primary-900 cursor-pointer"
          >
            <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
              <TimeBar value={query.totalTime} maxValue={maxTime} title={query.description} className="text-lime-500">
                {query.description}
              </TimeBar>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(query.totalTime)}>{getFormattedDuration(query.totalTime)}</span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(query.avgDuration)}>
                {getFormattedDuration(query.avgDuration)}
              </span>
            </td>
          </tr>
        ))}
      </Table.Body>
    </Table>
  );
};

export default Queries;
