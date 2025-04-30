import { useMemo } from 'react';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import Table from '~/ui/Table';
import { AGGREGATE_CALL_PROFILES_SORT_KEYS, AGGREGATE_PROFILES_HEADERS } from '../../constants';
import useSort from '../../hooks/useSort';
import useSentryStore from '../../store';
import type { AggregateCallData } from '../../types';
import { getFormattedDuration, getSpanDurationClassName } from '../../utils/duration';
import { TimeBar } from '../shared/TimeBar';

type AggregateCallProfileComparator = (a: AggregateCallData, b: AggregateCallData) => number;
type AggregateCallProfileSortTypes =
  (typeof AGGREGATE_CALL_PROFILES_SORT_KEYS)[keyof typeof AGGREGATE_CALL_PROFILES_SORT_KEYS];

const COMPARATORS: Record<AggregateCallProfileSortTypes, AggregateCallProfileComparator> = {
  [AGGREGATE_CALL_PROFILES_SORT_KEYS.functionName]: (a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  },
  [AGGREGATE_CALL_PROFILES_SORT_KEYS.totalTime]: (a, b) => a.totalTime - b.totalTime,
  [AGGREGATE_CALL_PROFILES_SORT_KEYS.samples]: (a, b) => a.samples - b.samples,
  [AGGREGATE_CALL_PROFILES_SORT_KEYS.traces]: (a, b) => a.traceIds.size - b.traceIds.size,
};

function Profiles() {
  const { sort, toggleSortOrder } = useSort({ defaultSortType: AGGREGATE_CALL_PROFILES_SORT_KEYS.totalTime });

  const aggregateCallData = useMemo(() => {
    const profiles = useSentryStore.getState().getAggregateCallData();
    const compareProfileInfo = COMPARATORS[sort.active] || COMPARATORS[AGGREGATE_CALL_PROFILES_SORT_KEYS.totalTime];

    return profiles.sort((a, b) => {
      return sort.asc ? compareProfileInfo(a, b) : compareProfileInfo(b, a);
    });
  }, [sort]);

  if (!aggregateCallData.length) {
    return <p className="text-primary-300 px-6 py-4">No profiles found.</p>;
  }

  // Calculate max time for bar visualization (100%, scaling form here)
  const maxTime = Math.max(...aggregateCallData.map(profile => profile.totalTime));

  return (
    <Table variant="detail">
      <Table.Header>
        <tr>
          {AGGREGATE_PROFILES_HEADERS.map(header => (
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
      </Table.Header>
      <Table.Body>
        {aggregateCallData.map(callData => (
          <tr key={`${callData.name}`} className="hover:bg-primary-900">
            <td className="text-primary-200 w-2/5 whitespace-nowrap px-6 py-4">
              <TimeBar value={callData.totalTime} maxValue={maxTime} title={callData.name} className="text-lime-500">
                {callData.name.split('@')[1].split(':', 1)[0]}
              </TimeBar>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(callData.totalTime)}>
                {getFormattedDuration(callData.totalTime)}
              </span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              {callData.samples}
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              {callData.traceIds.size}
            </td>
          </tr>
        ))}
      </Table.Body>
    </Table>
  );
}

export default Profiles;
