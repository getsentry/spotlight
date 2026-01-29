import type { MetricType } from "@sentry/core";
import { ReactComponent as X } from "@spotlight/ui/assets/cross.svg";
import { ReactComponent as Filter } from "@spotlight/ui/assets/filter.svg";
import { ReactComponent as Search } from "@spotlight/ui/assets/search.svg";
import { cn } from "@spotlight/ui/lib/cn";
import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { Badge } from "@spotlight/ui/ui/badge";
import { Button } from "@spotlight/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@spotlight/ui/ui/dropdownMenu";
import { Input } from "@spotlight/ui/ui/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSentryStore from "../../store";
import type { SentryMetricPayload } from "../../types";
import { getFormattedNumber } from "../../utils/duration";
import { aggregateMetrics, calculatePercentiles, groupMetricsByName } from "../../utils/metrics";
import { truncateId } from "../../utils/text";
import EmptyState from "../shared/EmptyState";
import MetricDetail from "./MetricDetail";
import MetricTypeBadge from "./components/MetricTypeBadge";

type MetricsListProps = {
  traceId?: string;
};

/** Represents a group of metrics with the same name */
type MetricGroup = {
  name: string;
  type: MetricType;
  samples: SentryMetricPayload[];
  latestTimestamp: number;
  unit?: string;
  aggregate: {
    sum?: number;
    avg?: number;
    min?: number;
    max?: number;
    count: number;
  };
  percentiles: Map<number, number>;
};

export default function MetricsList({ traceId }: MetricsListProps) {
  const { metricId } = useParams<{ metricId?: string }>();
  const selectedRef = useRef<HTMLDivElement>(null);
  const getMetrics = useSentryStore(state => state.getMetrics);
  const getMetricsByTraceId = useSentryStore(state => state.getMetricsByTraceId);
  const allMetrics = traceId ? getMetricsByTraceId(traceId) : getMetrics();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const allGroups = useMemo(() => {
    const groups = groupMetricsByName(allMetrics);
    const result: MetricGroup[] = [];

    for (const [name, samples] of groups) {
      const sorted = [...samples].sort((a, b) => b.timestamp - a.timestamp);
      const latest = sorted[0];
      const aggregate = aggregateMetrics(sorted, latest.type);
      const values = sorted.map(m => m.value);
      const percentiles = calculatePercentiles(values, [50, 90, 95, 99]);

      result.push({
        name,
        type: latest.type,
        samples: sorted,
        latestTimestamp: latest.timestamp,
        unit: latest.unit,
        aggregate,
        percentiles,
      });
    }

    // Sort by latest timestamp (newest first)
    return result.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [allMetrics]);

  const allMetricNames = useMemo(() => allGroups.map(g => g.name), [allGroups]);

  const metricGroups = useMemo(() => {
    let result = allGroups;

    if (selectedNames.size > 0) {
      result = result.filter(g => selectedNames.has(g.name));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    return result;
  }, [allGroups, selectedNames, searchQuery]);

  const toggleNameFilter = useCallback((name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedNames(new Set());
  }, []);

  useEffect(() => {
    if (metricId) {
      const decodedId = decodeURIComponent(metricId);
      for (const group of metricGroups) {
        if (group.samples.some(s => s.id === decodedId)) {
          setExpandedSections(prev => new Set([...prev, group.name]));
          break;
        }
      }
    }
  }, [metricId, metricGroups]);

  useEffect(() => {
    if (metricId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [metricId]);

  const toggleSection = useCallback((name: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  if (allMetrics.length === 0) {
    return (
      <EmptyState
        variant={traceId ? "simple" : "full"}
        className={traceId ? undefined : "h-full"}
        title={traceId ? undefined : "No Metrics"}
        description="No metrics yet. Send some trace-connected metrics to see them here."
        showDocsLink={!traceId}
      />
    );
  }

  const hasActiveFilters = selectedNames.size > 0;

  return (
    <>
      <div className="p-4 border-b border-primary-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder="Search metrics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-primary-700 bg-primary-950 w-full pl-9 text-white placeholder:text-gray-400"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "border-primary-700 hover:bg-primary-900 bg-primary-950 h-9 text-sm hover:text-white",
                  selectedNames.size > 0 && "border-primary-500",
                )}
              >
                <Filter className="mr-2 h-3.5 w-3.5" />
                Metrics
                {selectedNames.size > 0 && (
                  <span className="ml-1 rounded-full bg-primary-600 px-1.5 text-xs">{selectedNames.size}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-primary-700 bg-primary-950 text-white w-64 max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Filter by Metric Name</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allMetricNames.map(name => (
                <DropdownMenuCheckboxItem
                  key={name}
                  checked={selectedNames.has(name)}
                  onCheckedChange={() => toggleNameFilter(name)}
                  className="truncate"
                >
                  <span className="truncate">{name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(selectedNames).map(name => (
              <Badge key={name} className="text-white max-w-[200px]">
                <span className="truncate">{name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-4 w-4 text-gray-400 hover:bg-transparent hover:text-white"
                  onClick={() => toggleNameFilter(name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:bg-transparent hover:text-white"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <CardList>
        {metricGroups.length === 0 ? (
          <EmptyState
            variant="simple"
            description={
              traceId
                ? "No metrics yet. Send some trace-connected metrics to see them here."
                : "No metrics match the current filters."
            }
            showDocsLink={!traceId}
          />
        ) : (
          metricGroups.map(group => {
            const isExpanded = expandedSections.has(group.name);

            return (
              <MetricSection
                key={group.name}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => toggleSection(group.name)}
                traceId={traceId}
                selectedMetricId={metricId ? decodeURIComponent(metricId) : undefined}
                selectedRef={selectedRef}
              />
            );
          })
        )}
      </CardList>
      {metricId && <MetricDetail traceId={traceId} />}
    </>
  );
}

function MetricSection({
  group,
  isExpanded,
  onToggle,
  traceId,
  selectedMetricId,
  selectedRef,
}: {
  group: MetricGroup;
  isExpanded: boolean;
  onToggle: () => void;
  traceId?: string;
  selectedMetricId?: string;
  selectedRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="border-b border-primary-800 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-x-4 px-6 py-3 text-left hover:bg-primary-900 transition-colors pointer",
          isExpanded && "bg-primary-900/50",
        )}
      >
        <span className={cn("text-primary-400 transition-transform", isExpanded && "rotate-90")}>▶</span>

        <MetricTypeBadge type={group.type} />

        <div className="flex-1 overflow-hidden">
          <div className="text-primary-50 truncate font-mono text-sm">{group.name}</div>
        </div>

        <div className="text-primary-400 text-xs">
          {group.aggregate.count} sample{group.aggregate.count !== 1 ? "s" : ""}
          <span className="mx-2">&middot;</span>
          <TimeSince date={group.latestTimestamp * 1000} />
        </div>
      </button>

      {isExpanded && (
        <div className="bg-primary-950 border-t border-primary-800">
          <div className="px-6 py-2 bg-primary-900/30 border-b border-primary-800">
            <AggregateSummary group={group} />
          </div>

          {group.samples.map(sample => {
            const isSelected = selectedMetricId === sample.id;
            const ref = isSelected ? selectedRef : null;

            return (
              <div key={sample.id} ref={ref}>
                <MetricSampleItem sample={sample} traceId={traceId} isSelected={isSelected} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricSampleItem({
  sample,
  traceId,
  isSelected,
}: {
  sample: SentryMetricPayload;
  traceId?: string;
  isSelected: boolean;
}) {
  const route = traceId
    ? `/telemetry/traces/${traceId}/metrics/${encodeURIComponent(sample.id)}`
    : `/telemetry/metrics/${encodeURIComponent(sample.id)}`;

  return (
    <Link
      to={route}
      className={cn(
        "flex items-center gap-x-4 px-6 py-2 pl-12 hover:bg-primary-800 transition-colors",
        isSelected && "bg-primary-800",
      )}
    >
      <div className="text-primary-400 text-xs w-32">
        <TimeSince date={sample.timestamp * 1000} />
      </div>

      <div className="text-primary-50 font-mono text-sm font-semibold">{getFormattedNumber(sample.value)}</div>

      <div className="flex-1 text-right text-xs">
        {sample.trace_id && !traceId && (
          <Link
            to={`/telemetry/traces/${sample.trace_id}`}
            onClick={e => e.stopPropagation()}
            className="text-primary-400 hover:text-primary-100 underline font-mono"
          >
            {truncateId(sample.trace_id)}
          </Link>
        )}
        {sample.span_id && <span className="text-primary-500 ml-3 font-mono">span {truncateId(sample.span_id)}</span>}
      </div>
    </Link>
  );
}

function AggregateSummary({ group }: { group: MetricGroup }) {
  const { aggregate, percentiles, type } = group;
  const showPercentiles = (type === "gauge" || type === "distribution") && percentiles.size > 0;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
      <div>
        <span className="text-primary-400">Count:</span>
        <span className="text-primary-200 ml-1">{aggregate.count}</span>
      </div>
      {aggregate.sum !== undefined && (
        <div>
          <span className="text-primary-400">Sum:</span>
          <span className="text-primary-200 ml-1">{getFormattedNumber(aggregate.sum)}</span>
        </div>
      )}
      {aggregate.avg !== undefined && (
        <div>
          <span className="text-primary-400">Avg:</span>
          <span className="text-primary-200 ml-1">{getFormattedNumber(aggregate.avg)}</span>
        </div>
      )}
      {aggregate.min !== undefined && (
        <div>
          <span className="text-primary-400">Min:</span>
          <span className="text-primary-200 ml-1">{getFormattedNumber(aggregate.min)}</span>
        </div>
      )}
      {aggregate.max !== undefined && (
        <div>
          <span className="text-primary-400">Max:</span>
          <span className="text-primary-200 ml-1">{getFormattedNumber(aggregate.max)}</span>
        </div>
      )}
      {showPercentiles && (
        <>
          <div>
            <span className="text-primary-400">P50:</span>
            <span className="text-primary-200 ml-1">{getFormattedNumber(percentiles.get(50) ?? 0)}</span>
          </div>
          <div>
            <span className="text-primary-400">P90:</span>
            <span className="text-primary-200 ml-1">{getFormattedNumber(percentiles.get(90) ?? 0)}</span>
          </div>
          <div>
            <span className="text-primary-400">P95:</span>
            <span className="text-primary-200 ml-1">{getFormattedNumber(percentiles.get(95) ?? 0)}</span>
          </div>
        </>
      )}
    </div>
  );
}
