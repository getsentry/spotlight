import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import Breadcrumbs from '~/ui/Breadcrumbs';
import { QUERY_SUMMARY_HEADERS, QUERY_SUMMARY_SORT_KEYS } from '../../constants';
import { useSentrySpans } from '../../data/useSentrySpans';
import useSort from '../../hooks/useSort';
import type { Span } from '../../types';
import { getFormattedDuration } from '../../utils/duration';
import { truncateId } from '../../utils/text';

type SpanInfoComparator = (a: Span, b: Span) => number;
type QuerySummarySortTypes = (typeof QUERY_SUMMARY_SORT_KEYS)[keyof typeof QUERY_SUMMARY_SORT_KEYS];
const COMPARATORS: Record<QuerySummarySortTypes, SpanInfoComparator> = {
  [QUERY_SUMMARY_SORT_KEYS.foundIn]: (a, b) => {
    if (a.trace_id < b.trace_id) return -1;
    if (a.trace_id > b.trace_id) return 1;
    return 0;
  },
  [QUERY_SUMMARY_SORT_KEYS.spanId]: (a, b) => {
    if (a.span_id < b.span_id) return -1;
    if (a.span_id > b.span_id) return 1;
    return 0;
  },
  [QUERY_SUMMARY_SORT_KEYS.timeSpent]: (a, b) => a.timestamp - a.start_timestamp - (b.timestamp - b.start_timestamp),
};

const QuerySummary = ({ showAll }: { showAll: boolean }) => {
  const { allSpans, localSpans } = useSentrySpans();
  const { type } = useParams();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: QUERY_SUMMARY_SORT_KEYS.timeSpent });

  const filteredDBSpans: Span[] = useMemo(() => {
    if (!type) {
      return [];
    }
    const spans = showAll ? allSpans : localSpans;
    const compareSpanInfo = COMPARATORS[sort.active] || COMPARATORS[QUERY_SUMMARY_SORT_KEYS.timeSpent];

    // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/atob
    const decodedType: string = atob(type);

    return spans
      .filter(span => span.description === decodedType)
      .sort((a, b) => (sort.asc ? compareSpanInfo(a, b) : compareSpanInfo(b, a)));
  }, [allSpans, localSpans, showAll, sort, type]);

  if (!filteredDBSpans || !filteredDBSpans.length) {
    return <p className="text-primary-300 px-6 py-4">Query not found.</p>;
  }

  return (
    <>
      <Breadcrumbs
        crumbs={[
          {
            id: 'queries',
            label: 'Queries',
            link: true,
            to: '/insights/queries',
          },
          {
            id: 'querySummary',
            label: 'Query Summary',
            link: false,
          },
        ]}
      />
      <table className="divide-primary-700 w-full table-fixed divide-y">
        <thead>
          <tr>
            {QUERY_SUMMARY_HEADERS.map(header => (
              <th
                key={header.id}
                scope="col"
                className={classNames(
                  'text-primary-100 px-6 py-3.5 text-sm font-semibold',
                  header.primary ? 'w-2/5' : 'w-[15%]',
                )}
              >
                <div
                  className={classNames(
                    'flex cursor-pointer select-none items-center gap-1',
                    header.primary ? 'justify-start' : 'justify-end',
                  )}
                  onClick={() => toggleSortOrder(header.sortKey)}
                >
                  {header.title}
                  {sort.active === header.sortKey ? (
                    <SortDown
                      width={12}
                      height={12}
                      className={classNames(
                        'fill-primary-300',
                        sort.asc ? '-translate-y-0.5 rotate-0' : 'translate-y-0.5 rotate-180',
                      )}
                    />
                  ) : (
                    <Sort width={12} height={12} className="stroke-primary-300" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredDBSpans.map(span => (
            <tr key={span.span_id} className="hover:bg-primary-900">
              <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                <Link className="truncate hover:underline" to={`/explore/traces/${span.trace_id}`}>
                  {truncateId(span.trace_id)}
                </Link>
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link
                  className="truncate hover:underline"
                  to={`/explore/traces/${span.trace_id}/spans/${span.span_id}`}
                >
                  {truncateId(span.span_id)}
                </Link>
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {getFormattedDuration(span.timestamp - span.start_timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default QuerySummary;
