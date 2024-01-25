import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import { QUERIES_HEADERS, QUERIES_SORT_KEYS } from '../../constants';
import { useSentrySpans } from '../../data/useSentrySpans';
import { Span } from '../../types';
import { getFormattedDuration } from '../../utils/duration';

const filterDBSpans = (spans: Span[], regex?: RegExp) => {
  if (regex) {
    const _regex = new RegExp(regex);
    return spans.filter((span: Span) => _regex.test(span.op || ''));
  }
  return [];
};

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

const Queries = ({ showAll }: { showAll: boolean }) => {
  const [allSpans, localSpans] = useSentrySpans();
  const [queriesData, setQueriesData] = useState<QueryInfo[]>([]);
  const [sort, setSort] = useState({
    active: QUERIES_SORT_KEYS.timeSpent,
    asc: false,
  });

  const toggleSortOrder = (type: string) => {
    if (sort.active === type) {
      setSort(prev => ({
        active: type,
        asc: !prev.asc,
      }));
    } else {
      setSort({
        active: type,
        asc: false,
      });
    }
  };

  const compareQueryInfo = (a: QueryInfo, b: QueryInfo) => {
    switch (sort.active) {
      case QUERIES_SORT_KEYS.queryDesc: {
        if (a.description < b.description) return -1;
        if (a.description > b.description) return 1;
        return 0;
      }
      case QUERIES_SORT_KEYS.avgDuration:
        return a.avgDuration - b.avgDuration;
      case QUERIES_SORT_KEYS.timeSpent:
        return a.timeSpent - b.timeSpent;
      default:
        return a.timeSpent - b.timeSpent;
    }
  };

  useEffect(() => {
    const onlyDBSpans = filterDBSpans(showAll ? allSpans : localSpans, /db\.[A-Za-z]+/);

    if (onlyDBSpans.length > 0) {
      const uniqueQueries: string[] = [
        ...new Set(
          onlyDBSpans
            .map(span => span?.description)
            .map(String)
            .filter(query => query.trim() !== ''),
        ),
      ];
      setQueriesData(
        uniqueQueries
          .map(query => calculateQueryInfo({ query, spanData: onlyDBSpans }))
          .sort((a, b) => {
            return sort.asc ? compareQueryInfo(a, b) : compareQueryInfo(b, a);
          }),
      );
    }
  }, [showAll, sort]);

  if (queriesData) {
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
    <div className="text-primary-300 px-6 py-4">
      No Database queries found. Add integration in Sentry initialization to track Database queries.
    </div>
  );
};

export default Queries;
