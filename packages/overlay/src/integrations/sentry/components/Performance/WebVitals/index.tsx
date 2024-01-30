import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import { PERFORMANCE_SCORE_PROFILES, WEB_VITALS_HEADERS, WEB_VITALS_SORT_KEYS } from '~/integrations/sentry/constants';
import { useSentryEvents } from '~/integrations/sentry/data/useSentryEvents';
import { SentryEventWithPerformanceData } from '~/integrations/sentry/types';
import { getFormattedDuration } from '~/integrations/sentry/utils/duration';
import classNames from '~/lib/classNames';
import { normalizePerformanceScore } from '../../../utils/webVitals';

const WebVitals = ({ showAll }: { showAll: boolean }) => {
  const events = useSentryEvents();
  const [measurementEvents, setMeasurementEvents] = useState<SentryEventWithPerformanceData[]>([]);
  const [sort, setSort] = useState({
    active: WEB_VITALS_SORT_KEYS.score,
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

  const compareEvents = (a: SentryEventWithPerformanceData, b: SentryEventWithPerformanceData) => {
    switch (sort.active) {
      case WEB_VITALS_SORT_KEYS.pages: {
        if (a.transaction && b.transaction && a.transaction < b.transaction) return -1;
        if (a.transaction && b.transaction && a.transaction > b.transaction) return 1;
        return 0;
      }
      case WEB_VITALS_SORT_KEYS.lcp: {
        return a.measurements['score.lcp'].value - b.measurements['score.lcp'].value;
      }
      case WEB_VITALS_SORT_KEYS.fid: {
        return a.measurements['score.fid'].value - b.measurements['score.fid'].value;
      }
      case WEB_VITALS_SORT_KEYS.fcp: {
        return a.measurements['score.fcp'].value - b.measurements['score.fcp'].value;
      }
      case WEB_VITALS_SORT_KEYS.cls: {
        return a.measurements['score.cls'].value - b.measurements['score.cls'].value;
      }
      case WEB_VITALS_SORT_KEYS.ttfb: {
        return a.measurements['score.ttfb'].value - b.measurements['score.ttfb'].value;
      }
      case WEB_VITALS_SORT_KEYS.score: {
        return a.measurements['score.total'].value - b.measurements['score.total'].value;
      }
      default: {
        return a.measurements['score.total'].value - b.measurements['score.total'].value;
      }
    }
  };

  useEffect(() => {
    const _measurementEvents = [];
    for (const event of events) {
      if (
        event.measurements &&
        event?.contexts?.trace?.op === 'pageload'
        // TODO: Skipping this check because of not getting all required metrics
        // && !PERFORMANCE_SCORE_PROFILES.profiles[0].scoreComponents.some(c => {
        //   return (
        //     !Object.prototype.hasOwnProperty.call(event.measurements, c.measurement) &&
        //     Math.abs(c.weight) >= Number.EPSILON &&
        //     !c.optional
        //   );
        // })
      ) {
        const updatedEvent = { ...event };
        normalizePerformanceScore(updatedEvent, PERFORMANCE_SCORE_PROFILES);
        _measurementEvents.push(updatedEvent as unknown as SentryEventWithPerformanceData);
      }
    }
    setMeasurementEvents(
      _measurementEvents.sort((a, b) => {
        return sort.asc ? compareEvents(a, b) : compareEvents(b, a);
      }),
    );
  }, [showAll, sort]);

  if (measurementEvents && measurementEvents.length) {
    return (
      <>
        <table className="divide-primary-700 w-full table-fixed divide-y">
          <thead>
            <tr>
              {WEB_VITALS_HEADERS.map(header => (
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
            {measurementEvents.map(event => (
              <tr key={event.event_id} className="hover:bg-primary-900">
                <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                  <Link className="truncate hover:underline" to={`/performance/webvitals/${event.event_id}`}>
                    {event.transaction}
                  </Link>
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {event.measurements?.lcp ? getFormattedDuration(event.measurements.lcp.value) : '-'}
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {event.measurements?.fcp ? getFormattedDuration(event.measurements.fcp.value) : '-'}
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {event.measurements?.fid ? getFormattedDuration(event.measurements.fid.value) : '-'}
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {event.measurements?.cls ? event.measurements.cls.value : '-'}
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {event.measurements?.ttfb ? getFormattedDuration(event.measurements.ttfb.value) : '-'}
                </td>
                <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {event.measurements['score.total']?.value
                    ? Math.trunc(event.measurements['score.total'].value * 100)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
  return <div className="text-primary-300 px-6 py-4">No Measurements found.</div>;
};
export default WebVitals;
