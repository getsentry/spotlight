import { type KeyboardEvent, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactComponent as Filter } from "~/assets/filter.svg";
import { ReactComponent as Sort } from "~/assets/sort.svg";
import { ReactComponent as SortDown } from "~/assets/sortDown.svg";
import { cn } from "~/lib/cn";
import CardList from "~/telemetry/components/shared/CardList";
import { Button } from "~/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdownMenu";
import Table from "~/ui/table";
import { LOGS_HEADERS, LOGS_SORT_KEYS, LOG_LEVEL_COLORS } from "../../constants";
import { useSentryLogs } from "../../data/useSentryLogs";
import useColumnVisibility from "../../hooks/useColumnVisibility";
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
  [LOGS_SORT_KEYS.trace_id]: (a, b) => {
    const aTrace = a.trace_id || "";
    const bTrace = b.trace_id || "";
    return aTrace.localeCompare(bTrace);
  },
};

const LogsList = ({ traceId }: { traceId?: string }) => {
  const { id: selectedLogId } = useParams();
  const navigate = useNavigate();
  const allLogs = useSentryLogs(traceId);
  const { sort, toggleSortOrder } = useSort({ defaultSortType: LOGS_SORT_KEYS.timestamp });
  const { isColumnVisible, toggleColumn } = useColumnVisibility(LOGS_HEADERS.map(h => h.id));

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

  const visibleHeaders = LOGS_HEADERS.filter(header => isColumnVisible(header.id));

  return (
    <CardList>
      {logsData.length ? (
        <>
          <div className="flex justify-end px-6 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-700 hover:bg-primary-900 bg-primary-950 h-9 text-sm"
                >
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-primary-700 bg-primary-950 text-white w-56">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LOGS_HEADERS.map(header => (
                  <DropdownMenuCheckboxItem
                    key={header.id}
                    checked={isColumnVisible(header.id)}
                    onCheckedChange={() => toggleColumn(header.id)}
                  >
                    {header.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Table variant="detail">
            <Table.Header>
              <tr>
                {visibleHeaders.map((header, idx) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      "text-primary-100 py-3.5 text-sm font-semibold",
                      !header.primary && "w-[20%]",
                      header.primary && "w-[50%]",
                      idx === 0 && "ps-6",
                      idx === visibleHeaders.length - 1 && "pe-6",
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
                  {visibleHeaders.map((header, idx) => {
                    const paddings = cn(idx === 0 && "ps-6", idx === visibleHeaders.length - 1 && "pe-6");

                    if (header.id === "level" && isColumnVisible("level")) {
                      return (
                        <td key="level" className={cn("align-middle", paddings)}>
                          <span className={LOG_LEVEL_COLORS[log.level] || "text-primary-500"}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                      );
                    }
                    if (header.id === "message" && isColumnVisible("message")) {
                      return (
                        <td key="message" className={cn("text-sm truncate align-middle", paddings)}>
                          <span>{log.body}</span>
                        </td>
                      );
                    }
                    if (header.id === "trace_id" && isColumnVisible("trace_id")) {
                      return (
                        <td key="trace_id" className={cn("text-sm", paddings)}>
                          {log.trace_id ? (
                            <Link
                              to={`/telemetry/traces/${log.trace_id}`}
                              className="text-blue-400 hover:text-blue-300 underline max-w-[150px] truncate block"
                              onClick={e => e.stopPropagation()}
                            >
                              {log.trace_id}
                            </Link>
                          ) : (
                            <span className="text-primary-300 max-w-[150px] truncate block">N/A</span>
                          )}
                        </td>
                      );
                    }
                    if (header.id === "timestamp" && isColumnVisible("timestamp")) {
                      return (
                        <td key="timestamp" className={cn("text-right align-middle", paddings)}>
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </td>
                      );
                    }
                    if (header.id === "sdk" && isColumnVisible("sdk")) {
                      return (
                        <td
                          key="sdk"
                          className={cn(
                            "text-right align-middle",
                            paddings,
                          )}
                        >
                          <span>{log.sdk}</span>
                        </td>
                      );
                    }
                    return null;
                  })}
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
