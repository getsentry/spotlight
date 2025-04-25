import { useMemo } from 'react';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import { FUNCTION_PROFILES_HEADERS, FUNCTION_PROFILES_SORT_KEYS } from '../../constants';
import useSentryStore from '../../data/sentryStore';
import useSort from '../../hooks/useSort';
import type { FunctionProfile } from '../../types';
import { getFormattedDuration, getSpanDurationClassName } from '../../utils/duration';
import { TimeBar } from '../shared/TimeBar';

type FunctionProfileComparator = (a: FunctionProfile, b: FunctionProfile) => number;
type FunctionProfileSortTypes = (typeof FUNCTION_PROFILES_SORT_KEYS)[keyof typeof FUNCTION_PROFILES_SORT_KEYS];

const COMPARATORS: Record<FunctionProfileSortTypes, FunctionProfileComparator> = {
  [FUNCTION_PROFILES_SORT_KEYS.functionName]: (a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  },
  [FUNCTION_PROFILES_SORT_KEYS.timeSpent]: (a, b) => a.totalTime - b.totalTime,
  [FUNCTION_PROFILES_SORT_KEYS.samples]: (a, b) => a.samples - b.samples,
  [FUNCTION_PROFILES_SORT_KEYS.profiles]: (a, b) => {
    if (a.traceId < b.traceId) return -1;
    if (a.traceId > b.traceId) return 1;
    return 0;
  },
};

function FunctionProfiles() {
  const { sort, toggleSortOrder } = useSort({ defaultSortType: FUNCTION_PROFILES_SORT_KEYS.timeSpent });

  const functionProfiles = useMemo(() => {
    const profiles = useSentryStore.getState().getFunctionProfiles();
    const compareProfileInfo = COMPARATORS[sort.active] || COMPARATORS[FUNCTION_PROFILES_SORT_KEYS.timeSpent];

    return profiles.sort((a, b) => {
      return sort.asc ? compareProfileInfo(a, b) : compareProfileInfo(b, a);
    });
  }, [sort]);

  if (!functionProfiles.length) {
    return <p className="text-primary-300 px-6 py-4">No profiles found.</p>;
  }

  // Calculate max time for bar visualization (100%, scaling form here)
  const maxTime = Math.max(...functionProfiles.map(profile => profile.totalTime));

  return (
    <table className="divide-primary-700 w-full table-fixed divide-y">
      <thead>
        <tr>
          {FUNCTION_PROFILES_HEADERS.map(header => (
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
        {functionProfiles.map(profile => (
          <tr key={`${profile.traceId}-${profile.name}`} className="hover:bg-primary-900">
            <td className="text-primary-200 w-2/5 whitespace-nowrap px-6 py-4">
              <TimeBar value={profile.totalTime} maxValue={maxTime} title={profile.name} />
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(profile.totalTime)}>
                {getFormattedDuration(profile.totalTime)}
              </span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              {profile.samples}
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              {profile.traceId.substring(0, 8)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default FunctionProfiles;
