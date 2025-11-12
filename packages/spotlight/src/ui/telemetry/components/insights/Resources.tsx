import { useMemo } from "react";
import { ReactComponent as Sort } from "@spotlight/ui/assets/sort.svg";
import { ReactComponent as SortDown } from "@spotlight/ui/assets/sortDown.svg";
import { cn } from "@spotlight/ui/lib/cn";
import Table from "@spotlight/ui/ui/table";
import { RESOURCES_SORT_KEYS, RESOURCE_HEADERS } from "../../constants";
import { useSentrySpans } from "../../data/useSentrySpans";
import useSort from "../../hooks/useSort";
import type { Span } from "../../types";
import { formatBytes } from "../../utils/bytes";
import { getFormattedDuration, getSpanDurationClassName } from "../../utils/duration";

type ResourceInfo = {
  avgDuration: number;
  totalTime: number;
  description: string;
  avgEncodedSize: number;
  similarResources: Span[];
};

const calculateResourceInfo = ({ resource, spanData }: { resource: string; spanData: Span[] }): ResourceInfo => {
  const specificResources = spanData.filter((span: Span) => span.description === resource);
  const totalTimeInMs = specificResources.reduce(
    (acc: number, span: Span) => acc + (span.timestamp - span.start_timestamp),
    0,
  );
  const avgDuration = totalTimeInMs / specificResources.length;
  const avgEncodedSize =
    specificResources.reduce((acc: number, span: Span) => {
      const contentLength = span.data?.["http.response_content_length"];
      if (typeof contentLength === "number") {
        return acc + contentLength;
      }
      return acc;
    }, 0) / specificResources.length;

  return {
    avgDuration,
    totalTime: totalTimeInMs,
    description: resource,
    avgEncodedSize,
    similarResources: specificResources,
  };
};

const getResourceSpans = (spans: Span[], options: { type?: string; regex?: RegExp }) => {
  if (options.type) {
    return spans.filter((span: Span) => span.description === options.type);
  }
  if (options.regex) {
    const regex = new RegExp(options.regex);
    return spans.filter((span: Span) => regex.test(span.op || ""));
  }
  return [];
};

type ResourceInfoComparator = (a: ResourceInfo, b: ResourceInfo) => number;
type ResourceSortTypes = (typeof RESOURCES_SORT_KEYS)[keyof typeof RESOURCES_SORT_KEYS];
const COMPARATORS: Record<ResourceSortTypes, ResourceInfoComparator> = {
  [RESOURCES_SORT_KEYS.description]: (a, b) => {
    if (a.description < b.description) return -1;
    if (a.description > b.description) return 1;
    return 0;
  },
  [RESOURCES_SORT_KEYS.avgEncodedSize]: (a, b) => a.avgEncodedSize - b.avgEncodedSize,
  [RESOURCES_SORT_KEYS.avgDuration]: (a, b) => a.avgDuration - b.avgDuration,
  [RESOURCES_SORT_KEYS.totalTime]: (a, b) => a.totalTime - b.totalTime,
};

const Resources = () => {
  const allSpans = useSentrySpans();
  const { sort, toggleSortOrder } = useSort({ defaultSortType: RESOURCES_SORT_KEYS.totalTime });

  const resources = useMemo(() => {
    const filteredResourceSpans = getResourceSpans(allSpans, { regex: /resource\.[A-Za-z]+/ });
    const uniqueResourceDescriptionsSet = new Set(filteredResourceSpans.map(span => String(span?.description).trim()));
    // Clear out empty ones (they collapse as a single empty string since this is a set)
    uniqueResourceDescriptionsSet.delete("");
    const uniqueResourceDescriptions: string[] = [...uniqueResourceDescriptionsSet];
    const compareResourceInfo = COMPARATORS[sort.active] || COMPARATORS[RESOURCES_SORT_KEYS.totalTime];

    return uniqueResourceDescriptions
      .map(resource => calculateResourceInfo({ resource, spanData: filteredResourceSpans }))
      .sort((a, b) => {
        return sort.asc ? compareResourceInfo(a, b) : compareResourceInfo(b, a);
      });
  }, [sort, allSpans]);

  if (!resources?.length) {
    return <p className="text-primary-300 px-6 py-4">No Resource found.</p>;
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
              <span className={getSpanDurationClassName(resource.avgDuration)}>
                {getFormattedDuration(resource.avgDuration)}
              </span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <span className={getSpanDurationClassName(resource.totalTime)}>
                {getFormattedDuration(resource.totalTime)}
              </span>
            </td>
            <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              {formatBytes(resource.avgEncodedSize)}
            </td>
          </tr>
        ))}
      </Table.Body>
    </Table>
  );
};

export default Resources;
