import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorTitle } from '~/integrations/sentry/components/events/error/Error';
import useSentryStore from '~/integrations/sentry/store';
import type { SentryErrorEvent, Span, TraceContext } from '~/integrations/sentry/types';
import { formatBytes } from '~/integrations/sentry/utils/bytes';
import { getFormattedDuration } from '~/integrations/sentry/utils/duration';
import { isErrorEvent } from '~/integrations/sentry/utils/sentry';
import SidePanel, { SidePanelHeader } from '~/ui/SidePanel';
import Table from '~/ui/Table';
import DateTime from '../../shared/DateTime';
import SpanTree from '../../traces/spans/SpanTree';

function formatValue(name: string, value: unknown): ReactNode {
  if (typeof value === 'number') {
    if (name.indexOf('size') !== -1 || name.indexOf('length') !== -1) return formatBytes(value);
    return value.toLocaleString();
  }
  return `${value}` as ReactNode;
}

function AISpanDescription({ span }: { span: Span }) {
  let body = null;
  let headerText = null;

  if (span.description) {
    headerText = 'Description';
    body = <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm">{span.description}</pre>;
  } else {
    body = <div className="text-primary-300">No description recorded for this AI span.</div>;
  }

  return (
    <div>
      {headerText && <h2 className="mb-2 font-bold uppercase">{headerText}</h2>}
      {body}
    </div>
  );
}

type AISpanDetailsProps = {
  traceContext: TraceContext;
  span: Span;
  startTimestamp: number;
  totalDuration: number;
};

export default function AISpanDetails({ span, startTimestamp, totalDuration, traceContext }: AISpanDetailsProps) {
  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(50);
  const spanRelativeStart = span.start_timestamp - startTimestamp;
  const getEventsByTrace = useSentryStore(state => state.getEventsByTrace);

  const spanDuration = span.timestamp - span.start_timestamp;

  const errors = span.trace_id ? getEventsByTrace(span.trace_id).filter(isErrorEvent) : [];

  const backPath = '/agents';

  return (
    <SidePanel backto={backPath}>
      <SidePanelHeader
        title="AI Span Details"
        subtitle={
          <>
            {span.op && (
              <>
                {span.op} <span className="text-primary-500">&mdash;</span>{' '}
              </>
            )}
            {span.span_id}
          </>
        }
        backto={backPath}
      />

      <div className="space-y-6 p-6">
        <div>
          <div className="flex flex-col space-y-4">
            <div className="text-primary-300 flex flex-1 items-center gap-x-1">
              <DateTime date={span.start_timestamp} />
              <span>&mdash;</span>
              <span>
                <strong>{getFormattedDuration(spanRelativeStart)}</strong> into trace
              </span>
            </div>
            <div className="flex-1">
              <div className="border-primary-800 relative h-8 border py-1">
                <div
                  className="bg-primary-800 absolute bottom-0 top-0 -m-0.5 flex w-full items-center p-0.5"
                  style={{
                    left: `min(${(spanRelativeStart / totalDuration) * 100}%, 100% - 1px)`,
                    width: `max(1px, ${(spanDuration / totalDuration) * 100}%)`,
                  }}
                >
                  <span className="whitespace-nowrap">{getFormattedDuration(spanDuration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="flex flex-col items-start">
            <h2 className="mb-2 font-bold uppercase">Related Errors</h2>
            {errors.map(event => (
              <Link key={event.event_id} className="cursor-pointer underline" to={`/errors/${event.event_id}`}>
                <ErrorTitle event={event as SentryErrorEvent} />
              </Link>
            ))}
          </div>
        )}

        <AISpanDescription span={span} />

        <div>
          <h2 className="mb-2 font-bold uppercase">Tags</h2>
          {span.tags && Object.keys(span.tags).length ? (
            <Table className="w-full text-sm">
              <Table.Body>
                {Object.entries(span.tags).map(([key, value]) => (
                  <tr key={key} className="text-primary-300">
                    <th className=" w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                      <div className="w-full truncate">{key}</div>
                    </th>
                    <td className="py-0.5">
                      <pre className="whitespace-nowrap font-mono">{JSON.stringify(value, undefined, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <div className="text-primary-300">No tags recorded for this AI span.</div>
          )}
        </div>
        <div>
          <h2 className="mb-2 font-bold uppercase">Context</h2>
          <Table className="w-full text-sm">
            <Table.Body>
              {[
                ['status', span.status || ''],
                ['trace', span.trace_id],
                ['span', span.span_id],
                [
                  'parent',
                  span.parent_span_id ? (
                    <Link
                      className="underline"
                      to={`/traces/${span.trace_id}/spans/${span.parent_span_id}`}
                      key={`link-to-${span.parent_span_id}`}
                    >
                      {span.parent_span_id}
                    </Link>
                  ) : (
                    ''
                  ),
                ],
                ['op', span.op],
              ].map(([key, value]) => (
                <tr key={key as string} className="text-primary-300">
                  <th className=" w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                    <div className="w-full truncate">{key}</div>
                  </th>
                  <td className="py-0.5">
                    <pre className="whitespace-nowrap font-mono">{value}</pre>
                  </td>
                </tr>
              ))}
            </Table.Body>
          </Table>
        </div>

        {span.data && (
          <div>
            <h2 className="mb-2 font-bold uppercase">Data</h2>
            <Table className="w-full text-sm">
              <Table.Body>
                {Object.entries(span.data).map(([key, value]) => (
                  <tr key={key} className="text-primary-300">
                    <th className=" w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                      <div className="w-full truncate">{key}</div>
                    </th>
                    <td className="py-0.5">
                      <pre className="whitespace-nowrap font-mono">{formatValue(key, value)}</pre>
                    </td>
                  </tr>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {(span.children?.length ?? 0) > 0 && (
          <div>
            <h2 className="mb-2 font-bold uppercase">Sub-tree</h2>
            <SpanTree
              traceContext={traceContext}
              tree={[span]}
              startTimestamp={startTimestamp}
              totalDuration={totalDuration}
              spanNodeWidth={spanNodeWidth}
              setSpanNodeWidth={setSpanNodeWidth}
            />
          </div>
        )}
      </div>
    </SidePanel>
  );
}
