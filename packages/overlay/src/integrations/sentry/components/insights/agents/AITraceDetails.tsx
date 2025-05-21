import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createAITraceFromSpan, type SpotlightAITrace } from '~/integrations/sentry/data/SpotlightAITrace';
import { getFormattedDuration } from '~/integrations/sentry/utils/duration';
import Badge from '~/ui/Badge';
import SidePanel, { SidePanelHeader } from '~/ui/SidePanel';
import Table from '~/ui/Table';
import { useAISpansWithDescendants } from '../../../data/useSentryAISpans';
import DateTime from '../../shared/DateTime';
import SpanTree from '../../traces/spans/SpanTree';

interface ToolCallDetailProps {
  toolCall: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown> | string;
    state?: string;
    step?: number;
  };
}

function ToolCallDetail({ toolCall }: ToolCallDetailProps) {
  return (
    <div className="border-primary-700 mb-4 rounded border p-4">
      <h3 className="mb-2 font-bold">{toolCall.toolName}</h3>
      <div className="text-primary-400 mb-2 text-sm">ID: {toolCall.toolCallId}</div>

      <div className="mb-2">
        <h4 className="text-sm font-semibold uppercase">Arguments</h4>
        <div className="bg-primary-900 p-2">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      </div>

      {toolCall.result && (
        <div>
          <h4 className="text-sm font-semibold uppercase">Result</h4>
          <div className="bg-primary-900 p-2">
            {typeof toolCall.result === 'string' ? (
              <pre className="whitespace-pre-wrap break-words font-mono text-sm">{toolCall.result}</pre>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AITraceMetadata({ trace }: { trace: SpotlightAITrace }) {
  const metadata = [
    ['Trace ID', trace.id],
    ['Type', trace.getTypeBadge()],
    ['Operation', trace.operation],
    ['Timestamp', <DateTime key="timestamp" date={trace.timestamp} />],
    ['Duration', getFormattedDuration(trace.durationMs)],
    ['Tokens (prompt/completion)', trace.getTokensDisplay()],
  ];

  if (trace.metadata.functionId) {
    metadata.push(['Function ID', trace.metadata.functionId]);
  }

  if (trace.metadata.maxRetries !== undefined) {
    metadata.push(['Max Retries', String(trace.metadata.maxRetries)]);
  }

  if (trace.metadata.maxSteps !== undefined) {
    metadata.push(['Max Steps', String(trace.metadata.maxSteps)]);
  }

  if (trace.metadata.modelId) {
    metadata.push(['Model', trace.metadata.modelId]);
  }

  if (trace.metadata.modelProvider) {
    metadata.push(['Provider', trace.metadata.modelProvider]);
  }

  return (
    <div>
      <h2 className="mb-4 font-bold">Metadata</h2>
      <Table className="w-full text-sm">
        <Table.Body>
          {metadata.map(([key, value]) => (
            <tr key={key as string} className="text-primary-300">
              <th className="w-1/5 py-0.5 pr-4 text-left font-mono font-normal">
                <div className="w-full truncate">{key}</div>
              </th>
              <td className="py-0.5">
                <pre className="whitespace-nowrap font-mono">{value}</pre>
              </td>
            </tr>
          ))}
        </Table.Body>
      </Table>

      {Object.keys(trace.metadata.metadata).length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold uppercase">Custom Metadata</h3>
          <Table className="w-full text-sm">
            <Table.Body>
              {Object.entries(trace.metadata.metadata).map(([key, value]) => (
                <tr key={key} className="text-primary-300">
                  <th className="w-1/5 py-0.5 pr-4 text-left font-mono font-normal">
                    <div className="w-full truncate">{key}</div>
                  </th>
                  <td className="py-0.5">
                    <pre className="whitespace-nowrap font-mono">{JSON.stringify(value)}</pre>
                  </td>
                </tr>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  );
}

function PromptSection({ trace }: { trace: SpotlightAITrace }) {
  if (!trace.prompt) return null;

  return (
    <div>
      <h2 className="mb-4 font-bold">Prompt</h2>
      {trace.prompt.system && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold uppercase">System</h3>
          <div className="bg-primary-900 p-2">
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">{trace.prompt.system}</pre>
          </div>
        </div>
      )}

      {trace.prompt.messages && trace.prompt.messages.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase">Messages</h3>
          {trace.prompt.messages.map((message, i) => (
            <div key={`message-${i}-${message.role}`} className="border-primary-700 mb-4 rounded border p-2">
              <div className="mb-1 font-semibold capitalize">{message.role}</div>
              <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                {message.role === 'assistant' ? trace.response?.text : message.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponseSection({ trace }: { trace: SpotlightAITrace }) {
  if (!trace.response) return null;

  return (
    <div>
      <h2 className="mb-4 font-bold">Response</h2>
      {trace.response.finishReason && (
        <div className="mb-2">
          <span className="text-sm font-semibold uppercase">Finish Reason: </span>
          <span className="font-mono">{trace.response.finishReason}</span>
        </div>
      )}

      {trace.response.text && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold uppercase">Assistant Message</h3>
          <div className="border-primary-700 mb-4 rounded border p-2">
            <div className="mb-1 font-semibold capitalize">assistant</div>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">{trace.response.text}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolCallsSection({ trace }: { trace: SpotlightAITrace }) {
  if (trace.toolCalls.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 font-bold">Tool Calls</h2>
      {trace.toolCalls.map((toolCall, i) => (
        <ToolCallDetail key={`tool-${i}-${toolCall.toolCallId}`} toolCall={toolCall} />
      ))}
    </div>
  );
}

export default function AITraceDetail() {
  const { spanId } = useParams<{ spanId: string }>();
  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(50);
  const aiSpans = useAISpansWithDescendants();

  if (!spanId) {
    return (
      <SidePanel backto="/insights/agents">
        <SidePanelHeader title="AI Trace Detail" backto="/insights/agents" />
        <div className="p-6">No trace selected</div>
      </SidePanel>
    );
  }

  // Find the span with the matching ID from all AI spans
  const span = aiSpans.find(s => s.span_id === spanId);

  if (!span) {
    return (
      <SidePanel backto="/insights/agents">
        <SidePanelHeader title="AI Trace Detail" backto="/insights/agents" />
        <div className="p-6">Trace not found</div>
      </SidePanel>
    );
  }

  const trace = createAITraceFromSpan(span);
  const traceContext = { trace_id: span.trace_id };
  const startTimestamp = span.start_timestamp;
  const totalDuration = span.timestamp - span.start_timestamp;

  return (
    <SidePanel backto="/insights/agents">
      <SidePanelHeader
        title={trace.getDisplayTitle()}
        subtitle={
          <div className="flex items-center gap-2">
            <span className="text-primary-400">{trace.id}</span>
            <Badge color="primary">{trace.getTypeBadge()}</Badge>
            {trace.metadata.modelId && <Badge color="secondary">{trace.metadata.modelId}</Badge>}
            {trace.metadata.functionId && <Badge color="neutral">{trace.metadata.functionId}</Badge>}
          </div>
        }
        backto="/insights/agents"
      />

      <div className="space-y-6 p-6">
        <div>
          <div className="flex flex-col space-y-4">
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
                    width: '100%',
                  }}
                >
                  <span className="whitespace-nowrap">
                    {getFormattedDuration(span.timestamp - span.start_timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AITraceMetadata trace={trace} />
        <PromptSection trace={trace} />
        <ResponseSection trace={trace} />
        <ToolCallsSection trace={trace} />

        <div>
          <h2 className="mb-4 font-bold">Span Tree</h2>
          <SpanTree
            traceContext={traceContext}
            tree={[span]}
            startTimestamp={startTimestamp}
            totalDuration={totalDuration}
            spanNodeWidth={spanNodeWidth}
            setSpanNodeWidth={setSpanNodeWidth}
          />
        </div>
      </div>
    </SidePanel>
  );
}
