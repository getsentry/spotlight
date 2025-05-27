import { KeyboardEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import Table from '~/ui/Table';
import { LOGS_HEADERS, LOGS_SORT_KEYS } from '../../constants';
import { useSentryLogs } from '../../data/useSentryLogs';
import useSort from '../../hooks/useSort';
import { formatTimestamp } from '../../utils/duration';
import HiddenItemsButton from '../shared/HiddenItemsButton';
import LogDetails from './LogDetail';

type LogsData = {
  timestamp: number;
  message: string;
  sdk: string;
  id: string;
};

type LogsComparator = (a: LogsData, b: LogsData) => number;
type LogsSortTypes = (typeof LOGS_SORT_KEYS)[keyof typeof LOGS_SORT_KEYS];

const LogsList = () => {
  const { id: selectedLogId } = useParams();
  const navigate = useNavigate();
  const context = useSpotlightContext();
  const { allLogs, localLogs } = useSentryLogs();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: LOGS_SORT_KEYS.timestamp });

  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);

  const hiddenItemCount = allLogs.length - localLogs.length;
  const logs = showAll ? allLogs : localLogs;

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
      id: e.log_id,
    }));

    const compareProfileInfo = COMPARATORS[sort.active] || COMPARATORS[LOGS_SORT_KEYS.timestamp];

    return logsEventItems.sort((a, b) => {
      return sort.asc ? compareProfileInfo(a, b) : compareProfileInfo(b, a);
    });
  }, [sort, showAll, localLogs, allLogs]);

  const handleRowClick = (log: LogsData) => {
    navigate(`/logs/${log.id}`);
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, log: LogsData) => {
    if (e.key === 'Enter') {
      handleRowClick(log);
    }
  };

  return (
    <>
      {!showAll && hiddenItemCount > 0 && (
        <HiddenItemsButton
          itemCount={hiddenItemCount}
          onClick={() => {
            setShowAll(true);
          }}
        />
      )}
      {logsData?.length ? (
        <>
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
                <tr
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  onKeyDown={e => handleRowKeyDown(e, log)}
                  tabIndex={0}
                  role="link"
                  className="hover:bg-primary-900 cursor-pointer"
                >
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
          {selectedLogId && <LogDetails id={selectedLogId} />}
        </>
      ) : (
        <p className="text-primary-300 px-6 py-4">No logs found.</p>
      )}
    </>
  );
};

export default LogsList;
