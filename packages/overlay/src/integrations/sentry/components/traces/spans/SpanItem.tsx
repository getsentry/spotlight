import { getFormattedDuration } from "@spotlightjs/core";
import type { Span, TraceContext } from "@spotlightjs/core/sentry";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ReactComponent as ChevronIcon } from "~/assets/chevronDown.svg";
import { useSearch } from "~/integrations/sentry/context/SearchContext";
import { cn } from "~/lib/cn";
import { getSpanDurationClassName } from "../../../utils/duration";
import PlatformIcon from "../../shared/PlatformIcon";
import SpanResizer from "../../shared/SpanResizer";
import SpanTree from "./SpanTree";

const SpanItem = ({
  span,
  startTimestamp,
  totalDuration,
  depth = 1,
  traceContext,
  totalTransactions = 0,
  spanNodeWidth,
  setSpanNodeWidth = () => {},
}: {
  span: Span;
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
  traceContext: TraceContext;
  totalTransactions?: number;
  spanNodeWidth: number;
  setSpanNodeWidth?: (val: number) => void;
}) => {
  const { spanId } = useParams();
  const { query, matchesQuery, showOnlyMatched } = useSearch();
  const containerRef = useRef<HTMLLIElement>(null);
  const childrenCount = span.children ? span.children.length : 0;
  const [isItemCollapsed, setIsItemCollapsed] = useState(
    ((span.transaction && totalTransactions > 1) ||
      depth >= 10 ||
      childrenCount > 10 ||
      span.tags?.source === "profile") &&
      depth !== 1,
  );
  const [isResizing, setIsResizing] = useState(false);

  const spanDuration = span.timestamp - span.start_timestamp;

  const handleResize = (e: MouseEvent) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const newLeftWidth = ((mouseX - containerRect.left) / containerRect.width) * 100;
      setSpanNodeWidth(newLeftWidth);
    }
  };

  const isQueried = !showOnlyMatched && query && matchesQuery(span);

  return (
    <li key={span.span_id} ref={containerRef}>
      <Link
        className={cn(
          "hover:bg-primary-700 group flex rounded-xs text-sm",
          isQueried ? "bg-primary-200/20" : "",
          spanId === span.span_id ? "bg-primary-900" : "",
          span.tags?.source === "profile" ? "text-lime-500" : "",
        )}
        style={{
          pointerEvents: isResizing ? "none" : "auto",
        }}
        to={`/traces/${span.trace_id}/spans/${span.span_id}`}
      >
        <div
          className={cn(
            "node",
            "group-hover:bg-primary-700",
            "rounded-xs",
            isQueried ? "bg-transparent" : "",
            span.status && span.status !== "ok" ? "text-red-400" : "",
            spanId === span.span_id ? "bg-primary-900" : "bg-primary-950",
          )}
          style={{
            width: `${spanNodeWidth}%`,
            paddingRight: "30px",
          }}
        >
          {childrenCount > 0 && (
            <div
              className="bg-primary-600 z-10 mr-1 flex items-center gap-1 rounded-lg px-1 text-xs font-bold text-white"
              onClick={e => {
                e.preventDefault();
                setIsItemCollapsed(prev => !prev);
              }}
            >
              {childrenCount}
              <ChevronIcon
                width={12}
                height={12}
                className={cn("transition", isItemCollapsed ? "rotate-0" : "rotate-180")}
              />
            </div>
          )}
          {span.transaction && <PlatformIcon size={16} platform={span.transaction.platform} />}
          {span.op && (
            <>
              <span className="font-bold break-keep whitespace-nowrap">{span.op}</span>
              <span className="text-primary-400">&ndash;</span>
            </>
          )}
          <span className="block truncate" title={span.description || span.span_id}>
            {span.description || span.span_id}
          </span>
        </div>
        <div
          className={cn(
            "waterfall group-hover:bg-primary-700 rounded-xs overflow-hidden",
            isQueried ? "bg-transparent!" : "",
          )}
          style={{
            left: `${spanNodeWidth}%`,
            // height: "100%",
          }}
        >
          <SpanResizer setIsResizing={setIsResizing} isResizing={isResizing} handleResize={handleResize} />
          <div
            className="bg-primary-900 absolute -m-0.5 w-full h-full p-0.5"
            style={{
              left: `calc(min(${((span.start_timestamp - startTimestamp) / totalDuration) * 100}%, 95% - 1px) + 4px)`,
              width: `max(1px, ${(spanDuration / totalDuration) * 95}%)`,
            }}
          >
            <span className={cn("whitespace-nowrap", getSpanDurationClassName(spanDuration))}>
              {getFormattedDuration(spanDuration)}
            </span>
          </div>
        </div>
      </Link>

      {!isItemCollapsed && (
        <SpanTree
          traceContext={traceContext}
          tree={span.children || []}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          depth={childrenCount > 1 ? depth + 1 : depth}
          totalTransactions={totalTransactions}
          spanNodeWidth={spanNodeWidth}
          setSpanNodeWidth={setSpanNodeWidth}
        />
      )}
    </li>
  );
};

export default SpanItem;
