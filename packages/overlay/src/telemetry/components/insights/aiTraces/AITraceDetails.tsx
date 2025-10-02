import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  createAITraceFromSpan,
  detectAILibraryHandler,
} from "~/telemetry/components/insights/aiTraces/sdks/aiLibraries";
import type { AILibraryHandler, SpotlightAITrace } from "~/telemetry/types";
import { getFormattedDuration } from "~/telemetry/utils/duration";
import { Badge } from "~/ui/badge";
import SidePanel, { SidePanelHeader } from "~/ui/sidePanel";
import Table from "~/ui/table";
import { SearchProvider } from "../../../context/SearchContext";
import useSentryStore from "../../../store";
import DateTime from "../../shared/DateTime";
import SpanTree from "../../traces/spans/SpanTree";

const AI_TRACES_ROUTE = "/telemetry/insights/aitraces";

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
    <div className="border-primary-700 mb-4 rounded-sm border p-4">
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
            {typeof toolCall.result === "string" ? (
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

function AITraceMetadata({ trace, handler }: { trace: SpotlightAITrace; handler: AILibraryHandler }) {
  const metadata = [
    ["Trace ID", trace.id],
    ["Type", handler.getTypeBadge(trace)],
    ["Operation", trace.operation],
    ["Timestamp", <DateTime key="timestamp" date={trace.timestamp} />],
    ["Duration", getFormattedDuration(trace.durationMs)],
    ["Tokens (prompt/completion)", handler.getTokensDisplay(trace)],
  ];

  if (trace.metadata.functionId) {
    metadata.push(["Function ID", trace.metadata.functionId]);
  }

  if (trace.metadata.maxRetries !== undefined) {
    metadata.push(["Max Retries", String(trace.metadata.maxRetries)]);
  }

  if (trace.metadata.maxSteps !== undefined) {
    metadata.push(["Max Steps", String(trace.metadata.maxSteps)]);
  }

  if (trace.metadata.modelId) {
    metadata.push(["Model", trace.metadata.modelId]);
  }

  if (trace.metadata.modelProvider) {
    metadata.push(["Provider", trace.metadata.modelProvider]);
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
          {trace.prompt.messages.map((message, i) => {
            let messageContent: string;
            if (message.role === "assistant") {
              if (!trace.response?.text) {
                return null; // Don't render empty assistant messages
              }
              messageContent = trace.response.text;
            } else {
              messageContent = message.content;
            }

            return (
              <div key={`message-${i}-${message.role}`} className="border-primary-700 mb-4 rounded-sm border p-2">
                <div className="mb-1 font-semibold capitalize">{message.role}</div>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm">{messageContent}</pre>
              </div>
            );
          })}
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
          <div className="border-primary-700 mb-4 rounded-sm border p-2">
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

// embedded version for split view
export function AITraceDetailsEmbedded({ traceId, spanId }: { traceId: string; spanId: string }) {
  const trace = useSentryStore(state => state.getTraceById)(traceId);
  const span = trace?.spans.get(spanId);
  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(50);

  if (!trace || !span) {
    return (
      <div className="p-6">
        <p className="text-red-400">Span not found</p>
        <p className="text-sm text-gray-400">
          Looking for: {traceId} - {spanId}
        </p>
      </div>
    );
  }

  const aiTrace = createAITraceFromSpan(span);
  if (!aiTrace) {
    return (
      <div className="p-6">
        <p className="text-red-400">Unable to process AI trace</p>
        <p className="text-sm text-gray-400">Span ID: {spanId}</p>
        <p className="text-sm text-gray-400">Span description: {span.description}</p>
      </div>
    );
  }

  const handler = detectAILibraryHandler(span);

  if (!handler) {
    return (
      <div className="p-6">
        <p className="text-red-400">No Spotlight AI handler found for this AI trace</p>
        <p className="text-sm text-gray-400">Span ID: {spanId}</p>
        <p className="text-sm text-gray-400">Span description: {span.description}</p>
      </div>
    );
  }

  const startTimestamp = span.start_timestamp;
  const totalDuration = span.timestamp - span.start_timestamp;

  return (
    <SearchProvider>
      <div className="h-full overflow-y-auto">
        {/* Header Section */}
        <div className="border-b-primary-700 bg-primary-950 border-b px-6 py-4">
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-xl font-bold">{handler.getDisplayTitle(aiTrace)}</h2>
            <span className="text-primary-400 text-sm">{aiTrace.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={aiTrace.hasToolCall ? "warning" : "primary"}>{handler.getTypeBadge(aiTrace)}</Badge>
            {aiTrace.metadata.modelId && <Badge color="secondary">{aiTrace.metadata.modelId}</Badge>}
            {aiTrace.metadata.functionId && <Badge color="neutral">{aiTrace.metadata.functionId}</Badge>}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
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
                    width: "100%",
                  }}
                >
                  <span className="whitespace-nowrap">
                    {getFormattedDuration(span.timestamp - span.start_timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AITraceMetadata trace={aiTrace} handler={handler} />
          <PromptSection trace={aiTrace} />
          <ResponseSection trace={aiTrace} />
          <ToolCallsSection trace={aiTrace} />

          <div>
            <h2 className="mb-4 font-bold">Span Tree</h2>
            <SpanTree
              traceContext={trace}
              tree={[span]}
              startTimestamp={startTimestamp}
              totalDuration={totalDuration}
              spanNodeWidth={spanNodeWidth}
              setSpanNodeWidth={setSpanNodeWidth}
            />
          </div>
        </div>
      </div>
    </SearchProvider>
  );
}

// Original SidePanel version for insights tab
export default function AITraceDetail() {
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();

  if (!traceId || !spanId) {
    return (
      <SidePanel backto={AI_TRACES_ROUTE}>
        <SidePanelHeader title="AI Trace Details" backto={AI_TRACES_ROUTE} />
        <div className="p-6">No trace selected</div>
      </SidePanel>
    );
  }

  return (
    <SidePanel backto={AI_TRACES_ROUTE}>
      <SidePanelHeader title="AI Trace Details" backto={AI_TRACES_ROUTE} />
      <AITraceDetailsEmbedded traceId={traceId} spanId={spanId} />
    </SidePanel>
  );
}
