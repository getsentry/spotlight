import { useMemo } from 'react';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import { generateUuidv4 } from '~/lib/uuid';
import Table from '~/ui/Table';
import { LOGS_HEADERS, LOGS_SORT_KEYS } from '../../constants';
import { useSentryLogs } from '../../data/useSentryLogs';
import useSort from '../../hooks/useSort';
import { formatTimestamp } from '../../utils/duration';

type LogsData = {
  timestamp: number;
  message: string;
  sdk: string;
  id: string;
};
const Logs = ({ showAll }: { showAll: boolean }) => {
  const { allLogs, localLogs } = useSentryLogs();
  const logs = showAll ? allLogs : localLogs;
  const { sort, toggleSortOrder } = useSort({ defaultSortType: LOGS_SORT_KEYS.timestamp });

  type LogsComparator = (a: LogsData, b: LogsData) => number;
  type LogsSortTypes = (typeof LOGS_SORT_KEYS)[keyof typeof LOGS_SORT_KEYS];
  const COMPARATORS: Record<LogsSortTypes, LogsComparator> = {
    [LOGS_SORT_KEYS.timestamp]: (a, b) => {
      return a.timestamp - b.timestamp;
    },
  };

  const logsData = useMemo(() => {
    const logsEventItems: LogsData[] = logs.map(e => ({
      timestamp: e.timestamp,
      sdk: (e.attributes?.['sentry.sdk.name']?.value as string) || 'unknown',
      message: e.body,
      id: generateUuidv4(), // tried using timestamp and message - but getting same values sometimes.
    }));

    const compareProfileInfo = COMPARATORS[sort.active] || COMPARATORS[LOGS_SORT_KEYS.timestamp];

    return logsEventItems.sort((a, b) => {
      return sort.asc ? compareProfileInfo(a, b) : compareProfileInfo(b, a);
    });
  }, [sort, showAll, localLogs, allLogs]);

  if (!logsData?.length) {
    return <p className="text-primary-300 px-6 py-4">No logs found.</p>;
  }

  return (
    <Table variant="detail">
      <Table.Header>
        <tr>
          {LOGS_HEADERS.map(header => (
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
                onClick={() => header.sortKey && toggleSortOrder(header.sortKey)}
              >
                {header.title}
                {header.sortKey &&
                  (sort.active === header?.sortKey ? (
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
                  ))}
              </div>
            </th>
          ))}
        </tr>
      </Table.Header>
      <Table.Body>
        {logsData.map(log => (
          <tr key={log.id} className="hover:bg-primary-900">
            <td className="text-primary-200 w-2/5 whitespace-nowrap px-6 py-4 text-sm font-medium">
              <span>{log.message}</span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span>{formatTimestamp(log.timestamp)}</span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span>{log.sdk}</span>
            </td>
          </tr>
        ))}
      </Table.Body>
    </Table>
  );
};

export default Logs;
