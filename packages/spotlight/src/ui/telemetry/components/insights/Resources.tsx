import { ReactComponent as Sort } from "@spotlight/ui/assets/sort.svg";
import { ReactComponent as SortDown } from "@spotlight/ui/assets/sortDown.svg";
import { cn } from "@spotlight/ui/lib/cn";
import Table from "@spotlight/ui/ui/table";
import { useMemo } from "react";
import { type ResourceSummary, getResourceSummaries } from "../../../../telemetry/selectors/resources.ts";
import { RESOURCES_SORT_KEYS, RESOURCE_HEADERS } from "../../constants";
import { useSentrySpans } from "../../data/useSentrySpans";
import useSort from "../../hooks/useSort";
import { formatBytes } from "../../utils/bytes";
import { getFormattedDuration, getSpanDurationClassName } from "../../utils/duration";
import EmptyState from "../shared/EmptyState";

type ResourceInfo = ResourceSummary;

type ResourceInfoComparator = (a: ResourceInfo, b: ResourceInfo) => number;
type ResourceSortTypes = (typeof RESOURCES_SORT_KEYS)[keyof typeof RESOURCES_SORT_KEYS];
const COMPARATORS: Record<ResourceSortTypes, ResourceInfoComparator> = {
  [RESOURCES_SORT_KEYS.description]: (a, b) => {
    if (a.description < b.description) return -1;
    if (a.description > b.description) return 1;
    return 0;
  },
  [RESOURCES_SORT_KEYS.avgEncodedSize]: (a, b) => a.averageEncodedSizeBytes - b.averageEncodedSizeBytes,
  [RESOURCES_SORT_KEYS.avgDuration]: (a, b) => a.averageDurationMs - b.averageDurationMs,
  [RESOURCES_SORT_KEYS.totalTime]: (a, b) => a.totalDurationMs - b.totalDurationMs,
};

const Resources = () => {
  const allSpans = useSentrySpans();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: RESOURCES_SORT_KEYS.totalTime });

  const resources = useMemo(() => {
    const compareResourceInfo = COMPARATORS[sort.active] || COMPARATORS[RESOURCES_SORT_KEYS.totalTime];
    return getResourceSummaries(allSpans).sort((a, b) =>
      sort.asc ? compareResourceInfo(a, b) : compareResourceInfo(b, a),
    );
  }, [sort, allSpans]);

  if (!resources?.length) {
    return (
      <EmptyState
        variant="full"
        className="h-full"
        title="No Resources"
        description="No resources tracked. Enable browser tracing to see asset loading performance."
        showDocsLink
      />
    );
  }
  return (
    <Table variant="detail">
      <Table.Header>
        <tr>
          {RESOURCE_HEADERS.map(header => (
            <th
              key={header.id}
              scope="col"
              className={cn("text-primary-100 px-6 py-3.5 text-sm font-semibold", header.primary ? "w-2/5" : "w-[15%]")}
            >
              <div
                className={cn(
                  "flex cursor-pointer select-none items-center gap-1",
                  header.primary ? "justify-start" : "justify-end",
                )}
                onClick={() => toggleSortOrder(header.sortKey)}
              >
                {header.title}
                {sort.active === header.sortKey ? (
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
                )}
              </div>
            </th>
          ))}
        </tr>
      </Table.Header>
      <Table.Body>
        {resources.map((resource: ResourceInfo) => (
          <tr key={resource.description} className="hover:bg-primary-900">
            <td
              title={resource.description}
              className="text-primary-200 relative w-2/5 whitespace-nowrap px-6 py-4 text-left text-sm font-medium overflow-x-hidden"
            >
              <span className="cursor-default truncate block">{resource.description}</span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(resource.averageDurationMs)}>
                {getFormattedDuration(resource.averageDurationMs)}
              </span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(resource.totalDurationMs)}>
                {getFormattedDuration(resource.totalDurationMs)}
              </span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              {formatBytes(resource.averageEncodedSizeBytes)}
            </td>
          </tr>
        ))}
      </Table.Body>
    </Table>
  );
};

export default Resources;
