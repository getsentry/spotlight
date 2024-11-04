import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import { QUERIES_HEADERS, QUERIES_SORT_KEYS } from '../../constants';
import { useSentrySpans } from '../../data/useSentrySpans';
import type { Span } from '../../types';
import { getFormattedDuration } from '../../utils/duration';

const DB_SPAN_REGEX = /^db(\.[A-Za-z]+)?$/;

type QueryInfo = {
  avgDuration: number;
  timeSpent: number;
  description: string;
};

const calculateQueryInfo = ({ query, spanData }: { query: string; spanData: Span[] }): QueryInfo => {
  const queryTypeData = spanData.filter((span: Span) => span.description === query);
  const times = queryTypeData.map((span: Span) => span.timestamp - span.start_timestamp);
  const totalTimeInMs = times.reduce((acc: number, time: number) => acc + time, 0);
  const avgDuration = totalTimeInMs / times.length;

  return {
    avgDuration,
    timeSpent: totalTimeInMs,
    description: query,
  };
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
  [QUERIES_SORT_KEYS.timeSpent]: (a, b) => a.timeSpent - b.timeSpent,
};

const Queries = ({ showAll }: { showAll: boolean }) => {
  const [allSpans, localSpans] = useSentrySpans();
  const [sort, setSort] = useState({
    active: QUERIES_SORT_KEYS.timeSpent,
    asc: false,
  });

  const toggleSortOrder = (type: string) =>
    setSort(prev =>
      prev.active === type
        ? {
            active: type,
            asc: !prev.asc,
          }
        : {
            active: type,
            asc: false,
          },
    );

  const queriesData: QueryInfo[] = useMemo(() => {
    const compareQueryInfo = COMPARATORS[sort.active] || COMPARATORS[QUERIES_SORT_KEYS.timeSpent];
    const spans = showAll ? allSpans : localSpans;
    const onlyDBSpans = spans.filter((span: Span) => DB_SPAN_REGEX.test(span.op || ''));
    const uniqueSpansSet = new Set(onlyDBSpans.map(span => String(span?.description).trim()));
    // CLear out empty ones (they collapse as a single empty string since this is a set)
    uniqueSpansSet.delete('');
    return [...uniqueSpansSet]
      .map(query => calculateQueryInfo({ query, spanData: onlyDBSpans }))
      .sort((a, b) => (sort.asc ? compareQueryInfo(a, b) : compareQueryInfo(b, a)));
  }, [allSpans, localSpans, showAll, sort]);

  if (queriesData?.length) {
    return (
      <table className="divide-primary-700 w-full table-fixed divide-y">
        <thead>
          <tr>
            {QUERIES_HEADERS.map(header => (
              <th
                key={header.id}
                scope="col"
                className={classNames(
                  'text-primary-100 select-none px-6 py-3.5 text-sm font-semibold',
                  header.primary ? 'w-2/5' : 'w-[15%]',
                )}
              >
                <div
                  className={classNames(
                    'flex cursor-pointer items-center gap-1',
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
          {queriesData.map(query => (
            <tr key={query.description} className="hover:bg-primary-900">
              <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                <Link className="truncate hover:underline" to={`/performance/queries/${query.description}`}>
                  {query.description}
                </Link>
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {getFormattedDuration(query.avgDuration)}
              </td>
              <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {getFormattedDuration(query.timeSpent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <p className="text-primary-300 px-6 py-4">
      No Database queries found. Add integration in Sentry initialization to track Database queries.
    </p>
  );
};

export default Queries;
