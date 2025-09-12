import { type KeyboardEvent, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as Sort } from "~/assets/sort.svg";
import { ReactComponent as SortDown } from "~/assets/sortDown.svg";
import { cn } from "~/lib/cn";
import CardList from "~/telemetry/components/shared/CardList";
import Table from "~/ui/table";
import { LOGS_HEADERS, LOGS_SORT_KEYS, LOG_LEVEL_COLORS } from "../../constants";
import { useSentryLogs } from "../../data/useSentryLogs";
import useSort from "../../hooks/useSort";
import type { SentryLogEventItem } from "../../types";
import { formatTimestamp } from "../../utils/duration";
import LogDetails from "./LogDetail";

type LogsComparator = (a: SentryLogEventItem, b: SentryLogEventItem) => number;
type LogsSortTypes = (typeof LOGS_SORT_KEYS)[keyof typeof LOGS_SORT_KEYS];
const COMPARATORS: Record<LogsSortTypes, LogsComparator> = {
  [LOGS_SORT_KEYS.timestamp]: (a, b) => {
    return a.timestamp - b.timestamp;
  },
  [LOGS_SORT_KEYS.sdk]: (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  },
  [LOGS_SORT_KEYS.level]: (a, b) => {
    return a.severity_number - b.severity_number;
  },
};

const LogsList = ({ traceId }: { traceId?: string }) => {
  const { id: selectedLogId } = useParams();
  const navigate = useNavigate();
  const { allLogs } = useSentryLogs(traceId);
  const { sort, toggleSortOrder } = useSort({ defaultSortType: LOGS_SORT_KEYS.timestamp });

  const logsData = useMemo(() => {
    const compareLogData = COMPARATORS[sort.active] || COMPARATORS[LOGS_SORT_KEYS.timestamp];

    return allLogs.sort((a, b) => {
      return sort.asc ? compareLogData(a, b) : compareLogData(b, a);
    });
  }, [allLogs, sort.active, sort.asc]);

  const handleRowClick = (log: SentryLogEventItem) => {
    navigate(`/telemetry/logs/${log.id}`);
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, log: SentryLogEventItem) => {
    if (e.key === "Enter") {
      handleRowClick(log);
    }
  };

  return (
    <CardList>
      {logsData.length ? (
        <>
          <Table variant="detail">
            <Table.Header>
              <tr>
                {LOGS_HEADERS.map((header, idx) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      "text-primary-100 py-3.5 text-sm font-semibold",
                      !header.stretch && "w-[20%]",
                      header.primary && "w-[50%]",
                      idx === 0 && "ps-6",
                      idx === LOGS_HEADERS.length - 1 && "pe-6",
                    )}
                  >
                    <div
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-1",
                        `justify-${header.align === "right" ? "end" : "start"}`,
                      )}
                      onClick={() => header.sortKey && toggleSortOrder(header.sortKey)}
                    >
                      {header.title}
                      {header.sortKey &&
                        (sort.active === header?.sortKey ? (
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
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </Table.Header>
            <Table.Body className="text-primary-200 whitespace-nowrap font-mono text-xs font-medium">
              {logsData.map(log => (
                <tr
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  onKeyDown={e => handleRowKeyDown(e, log)}
                  tabIndex={0}
                  role="link"
                  className="hover:bg-primary-900 cursor-pointer"
                >
                  <td className="ps-6">
                    <span className={LOG_LEVEL_COLORS[log.level] || "text-primary-500"}>{log.level.toUpperCase()}</span>
                  </td>
                  <td className="text-sm">
                    <span>{log.body}</span>
                  </td>
                  <td className="text-right">
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </td>
                  <td className="pe-6 text-right">
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
    </CardList>
  );
};

export default LogsList;
