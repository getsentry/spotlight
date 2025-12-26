import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import { Button } from "@spotlight/ui/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@spotlight/ui/ui/empty";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TraceSplitViewLayout } from "../../tabs/TracesTab";
import type { Trace } from "../../types";
import TraceItem from "./TraceItem";

type TraceListProps = {
  traceData: {
    filtered: Trace[];
    all: Trace[];
  };
};

export default function TraceList({ traceData }: TraceListProps) {
  const [aiMode, setAiMode] = useState(false);
  const onToggle = useCallback(() => {
    setAiMode(prev => !prev);
  }, []);
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const selectedTraceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (traceId && selectedTraceRef.current) {
      selectedTraceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [traceId]);

  if (traceData.all.length === 0) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyTitle>No Traces</EmptyTitle>
          <EmptyDescription>
            Make sure you have set Sentry up in your project and enabled Spotlight integration
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <a
            href="https://spotlightjs.com/docs/setup/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-400"
          >
            Spotlight Docs
          </a>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <CardList>
      {traceData.filtered.length > 0 ? (
        traceData.filtered.map(trace => {
          const isSelected = traceId === trace.trace_id;
          const ref = isSelected ? selectedTraceRef : null;

          return (
            <div key={trace.trace_id} id={trace.trace_id} ref={ref}>
              {isSelected ? (
                <TraceSplitViewLayout
                  trace={trace}
                  span={spanId ? trace.spans.get(spanId) : undefined}
                  aiConfig={{
                    mode: aiMode,
                    onToggle,
                  }}
                />
              ) : (
                <TraceItem trace={trace} />
              )}
            </div>
          );
        })
      ) : (
        <div className="text-primary-300 p-6">
          Looks like there are no traces recorded matching the applied search & filters. 🤔
        </div>
      )}
    </CardList>
  );
}
