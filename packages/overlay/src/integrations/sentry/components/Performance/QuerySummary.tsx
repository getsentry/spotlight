import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import Breadcrumbs from '~/components/Breadcrumbs';
import classNames from '~/lib/classNames';
import { QUERY_SUMMARY_HEADERS, QUERY_SUMMARY_SORT_KEYS } from '../../constants';
import { useSentrySpans } from '../../data/useSentrySpans';
import { Span } from '../../types';
import { getFormattedDuration } from '../../utils/duration';

const filterDBSpans = (spans: Span[], type?: string) => {
  if (type) {
    return spans.filter((span: Span) => span.description === type);
  }

  return [];
};

const QuerySummary = ({ showAll }: { showAll: boolean }) => {
  const [allSpans, localSpans] = useSentrySpans();
  const { type } = useParams();
  const [filteredDBSpans, setFilteredDBSpans] = useState<Span[]>([]);
  const [sort, setSort] = useState({
    active: QUERY_SUMMARY_SORT_KEYS.timeSpent,
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

  const compareSpanInfo = (a: Span, b: Span) => {
    switch (sort.active) {
      case QUERY_SUMMARY_SORT_KEYS.foundIn: {
        if (a.trace_id < b.trace_id) return -1;
        if (a.trace_id > b.trace_id) return 1;
        return 0;
      }
      case QUERY_SUMMARY_SORT_KEYS.spanId: {
        if (a.span_id < b.span_id) return -1;
        if (a.span_id > b.span_id) return 1;
        return 0;
      }
      case QUERY_SUMMARY_SORT_KEYS.timeSpent: {
        const aTimeSpent = a.timestamp - a.start_timestamp;
        const bTimeSpent = b.timestamp - b.start_timestamp;
        return aTimeSpent - bTimeSpent;
      }
      default: {
        const aTimeSpent = a.timestamp - a.start_timestamp;
        const bTimeSpent = b.timestamp - b.start_timestamp;
        return aTimeSpent - bTimeSpent;
      }
    }
  };

  useEffect(() => {
    setFilteredDBSpans(
      filterDBSpans(showAll ? allSpans : localSpans, type).sort((a, b) => {
        return sort.asc ? compareSpanInfo(a, b) : compareSpanInfo(b, a);
      }),
    );
  }, [showAll, sort]);

  if (filteredDBSpans && type) {
    return (
      <>
        <Breadcrumbs
          crumbs={[
            {
              id: 'queries',
              label: 'Queries',
              link: true,
              to: '/performance/queries',
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
            {filteredDBSpans.map(span => (
              <tr key={span.span_id} className="hover:bg-primary-900">
                <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                  <Link className="truncate hover:underline" to={`/traces/${span.trace_id}`}>
                    {span.trace_id}
                  </Link>
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link className="truncate hover:underline" to={`/traces/${span.trace_id}/${span.span_id}`}>
                    {span.span_id}
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
  }
};

export default QuerySummary;
