import { Navigate, Route, Routes } from "react-router-dom";
import { format as formatSQL } from "sql-formatter";
import Tabs from "~/components/tabs";
import { getFormattedDuration } from "~/integrations/sentry/utils/duration";
import { isErrorEvent } from "~/integrations/sentry/utils/sentry";
import { createTab } from "~/integrations/sentry/utils/tabs";
import JsonViewer from "../../../../../components/JsonViewer";
import { DB_SPAN_REGEX } from "../../../constants";
import useSentryStore from "../../../store";
import type { Span, Trace } from "../../../types";
import EventList from "../../events/EventList";
import LogsList from "../../log/LogsList";
import { ContextView } from "../../shared/ContextView";
import DateTime from "../../shared/DateTime";
import TraceIcon from "../TraceIcon";

function DBSpanDescription({ desc, dbType }: { desc: string; dbType?: string }) {
  if (desc.startsWith("{") || dbType === "mongodb") {
    // looks like JSON?
    try {
      return <JsonViewer data={JSON.parse(desc)} />;
    } catch (_err) {
      // pass
    }
  }

  let description = desc;
  if (desc.match(/^(SELECT|INSERT|UPDATE|DELETE|TRUNCATE|ALTER) /i)) {
    try {
      description = formatSQL(desc.replace(/([\s,(])(%[a-z])([\s,)])/gim, "$1?$3"), { language: dbType || "sql" });
    } catch (err) {
      console.error(err);
    }
  }

  return <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm">{description}</pre>;
}

function SpanDescription({ span }: { span: Span }) {
  let body = null;
  let headerText = null;
  if (span.op && DB_SPAN_REGEX.test(span.op) && span.description) {
    headerText = "Query";
    body = <DBSpanDescription desc={span.description} dbType={span.data?.["db.system"] as string} />;
  } else if (span.op === "resource.img" && span.description?.indexOf("/") === 0) {
    headerText = "Preview";
    body = (
      <a
        href={span.description}
        className="border-primary-950 hover:border-primary-700 -m-2 inline-block max-w-sm cursor-pointer rounded border p-1"
      >
        <img src={span.description} alt="preview" style={{ maxHeight: 300 }} />
      </a>
    );
  } else if (span.description) {
    headerText = "Description";
    body = <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm">{span.description}</pre>;
  } else {
    body = <div className="text-primary-300">No description recorded for this span.</div>;
  }
  return (
    <div className="space-y-4 px-6 py-4">
      {headerText && <h2 className="mb-2 font-bold uppercase">{headerText}</h2>}
      {body}
    </div>
  );
}

export function SpanContext({ span }: { span: Span }) {
  const contextEntries: [string, Record<string, unknown>][] = span.data ? [["data", span.data]] : [];
  return (
    <>
      <div className="space-y-6 p-6">
        <div className="text-primary-300 flex flex-1 items-center gap-x-1">
          <DateTime date={span.start_timestamp} />
          <span>&mdash;</span>
          <span>
            <strong>{getFormattedDuration(span.timestamp - span.start_timestamp)}</strong> duration
          </span>
        </div>
        <div className="flex-1">
          <div className="border-primary-800 relative h-8 border py-1">
            <div
              className="bg-primary-800 absolute bottom-0 top-0 -m-0.5 flex w-full items-center p-0.5"
              style={{
                left: 0,
                width: "100%",
              }}
            >
              <span className="whitespace-nowrap">{getFormattedDuration(span.timestamp - span.start_timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6 py-4">
        <h2 className="mb-2 font-bold uppercase">ID</h2>
        {span.span_id}
      </div>
      <SpanDescription span={span} />
      <ContextView context={contextEntries} tags={span.tags} />
    </>
  );
}

export default function SpanDetails({
  traceId,
  spanId,
}: {
  traceId: string;
  spanId: string;
}) {
  const getEventsByTrace = useSentryStore(state => state.getEventsByTrace);
  const trace = useSentryStore(state => state.getTraceById(traceId));

  if (!trace) {
    return <div>Error: cannot find trace: {traceId}</div>;
  }

  const span = trace?.spans.get(spanId);

  if (!span) {
    return <div>Error: cannot find span: {`${traceId}@${spanId}`}</div>;
  }

  // TODO: try to narrow errors to the span and its children?
  const errors = span.trace_id ? getEventsByTrace(span.trace_id).filter(isErrorEvent) : [];
  const errorCount = errors.length;

  const tabs = [
    createTab("context", "Context"),
    // TODO: Narrow down logs to the span and its children
    createTab("logs", "Logs"),
    createTab("errors", "Errors", {
      notificationCount: {
        count: errorCount,
        severe: errorCount > 0,
      },
    }),
  ];

  return (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="context" element={<SpanContext span={span} />} />
          <Route path="errors" element={<EventList traceId={traceId} />} />
          <Route path="logs" element={<LogsList traceId={traceId} />} />
          <Route path="logs/:id" element={<LogsList traceId={traceId} />} />
          {/* Default tab */}
          <Route path="*" element={<Navigate to="context" replace />} />
        </Routes>
      </div>
    </>
  );
}
