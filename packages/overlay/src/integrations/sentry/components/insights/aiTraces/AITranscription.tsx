import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ReactComponent as CrossIcon } from "~/assets/cross.svg";
import useSearchInput from "~/integrations/sentry/hooks/useSearchInput";
import useSentryStore from "~/integrations/sentry/store";
import type { SpotlightAITrace } from "~/integrations/sentry/types";
import { getFormattedDuration } from "~/integrations/sentry/utils/duration";
import classNames from "~/lib/classNames";
import DateTime from "../../shared/DateTime";
import { createAITraceFromSpan, extractAllAIRootSpans } from "./sdks/aiLibraries";

type ConversationMessage = {
  id: string;
  type: "user" | "ai-response" | "ai-tool-call";
  content: string;
  timestamp: number;
  spanId: string;
  metadata?: {
    toolCall?: {
      toolName: string;
      args: Record<string, unknown>;
      result?: Record<string, unknown> | string;
    };
    tokens?: {
      prompt?: number;
      completion?: number;
    };
    duration?: number;
    operation?: string;
  };
};

function parseAITracesToConversation(aiTraces: SpotlightAITrace[]): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  const seenUserPrompts = new Set<string>();

  // Get all raw spans sorted by timestamp
  const allSpans = aiTraces.map(trace => trace.rawSpan).sort((a, b) => a.start_timestamp - b.start_timestamp);

  for (const span of allSpans) {
    const aiTrace = createAITraceFromSpan(span);
    if (!aiTrace) continue;

    // Extract user prompt (only once per unique prompt)
    if (aiTrace.prompt?.messages) {
      const userMessages = aiTrace.prompt.messages
        .filter(msg => msg.role === "user" || msg.role === "human")
        .map(msg => msg.content)
        .filter(content => content?.trim())
        .join("\n\n");

      if (userMessages && !seenUserPrompts.has(userMessages)) {
        seenUserPrompts.add(userMessages);
        messages.push({
          id: `${span.span_id}-user`,
          type: "user",
          content: userMessages,
          timestamp: span.start_timestamp,
          spanId: span.span_id,
        });
      }
    } else if (aiTrace.prompt?.system && !seenUserPrompts.has(aiTrace.prompt.system)) {
      seenUserPrompts.add(aiTrace.prompt.system);
      messages.push({
        id: `${span.span_id}-user`,
        type: "user",
        content: aiTrace.prompt.system,
        timestamp: span.start_timestamp,
        spanId: span.span_id,
      });
    }

    // Extract individual tool calls (each as separate message)
    aiTrace.toolCalls.forEach((toolCall, index) => {
      messages.push({
        id: `${span.span_id}-tool-${index}`,
        type: "ai-tool-call",
        content: `Using ${toolCall.toolName}`,
        timestamp: span.start_timestamp + index * 10, // Slight offset for ordering
        spanId: span.span_id,
        metadata: {
          toolCall: {
            toolName: toolCall.toolName,
            args: toolCall.args,
            result: toolCall.result,
          },
          duration: aiTrace.durationMs,
          operation: aiTrace.operation,
        },
      });
    });

    // Extract AI text response (if any)
    if (aiTrace.response?.text) {
      messages.push({
        id: `${span.span_id}-response`,
        type: "ai-response",
        content: aiTrace.response.text,
        timestamp: span.timestamp - 1, // Near the end of span
        spanId: span.span_id,
        metadata: {
          tokens: {
            prompt: aiTrace.promptTokens,
            completion: aiTrace.completionTokens,
          },
          duration: aiTrace.durationMs,
          operation: aiTrace.operation,
        },
      });
    } else if (aiTrace.toolCalls.length === 0) {
      // If no tool calls and no text response, but it's an AI span, show operation
      let aiContent = "";
      if (aiTrace.name && aiTrace.name !== "AI Interaction") {
        aiContent = aiTrace.name;
      } else {
        aiContent = `${aiTrace.operation} operation`;
      }

      messages.push({
        id: `${span.span_id}-operation`,
        type: "ai-response",
        content: aiContent,
        timestamp: span.timestamp - 1,
        spanId: span.span_id,
        metadata: {
          tokens: {
            prompt: aiTrace.promptTokens,
            completion: aiTrace.completionTokens,
          },
          duration: aiTrace.durationMs,
          operation: aiTrace.operation,
        },
      });
    }
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

function ConversationBubble({
  message,
  isSelected,
  traceId,
}: { message: ConversationMessage; isSelected: boolean; traceId: string }) {
  const isUser = message.type === "user";
  const isToolCall = message.type === "ai-tool-call";
  // const isAIResponse = message.type === 'ai-response';

  const bubbleContent = (
    <div
      className={classNames(
        "max-w-[80%] rounded-lg border p-3",
        isUser
          ? "border-blue-500/30 bg-blue-600/20 text-blue-100"
          : isToolCall
            ? isSelected
              ? "border-orange-400 bg-orange-600/30 text-orange-100"
              : "border-orange-500/30 bg-orange-600/20 text-orange-200"
            : isSelected
              ? "bg-primary-800 border-primary-500 text-primary-100"
              : "bg-primary-900 border-primary-700 text-primary-200",
      )}
    >
      {isUser && <div className="mb-1 text-xs font-medium text-blue-300">User:</div>}

      {/* Message content */}
      <div className="mb-1 whitespace-pre-wrap text-sm">{message.content}</div>

      {/* AI metadata */}
      {!isUser && message.metadata && (
        <div className="space-y-1">
          {/* Tool call details (for tool call messages) */}
          {message.metadata.toolCall && (
            <div className="space-y-1">
              <div className="rounded border border-orange-500/30 bg-orange-500/20 p-2 text-xs">
                {message.metadata.toolCall.args && Object.keys(message.metadata.toolCall.args).length > 0 && (
                  <div className="mb-1">
                    <div className="mb-0.5 font-medium text-orange-300">Arguments:</div>
                    <div className="font-mono text-xs text-orange-200">
                      {JSON.stringify(message.metadata.toolCall.args, null, 2)}
                    </div>
                  </div>
                )}
                {message.metadata.toolCall.result && (
                  <div>
                    <div className="mb-0.5 font-medium text-orange-300">Result:</div>
                    <div className="font-mono text-xs text-orange-200">
                      {(() => {
                        const rawResult = message.metadata.toolCall.result;
                        if (typeof rawResult === "string") {
                          return rawResult;
                        }
                        // Show the tool call result text if any
                        if (
                          typeof rawResult === "object" &&
                          rawResult !== null &&
                          typeof rawResult.result === "string"
                        ) {
                          return rawResult.result;
                        }
                        // Otherwise, stringify the whole rawResult object
                        return JSON.stringify(rawResult, null, 2);
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Token and duration info */}
          <div className="text-primary-400 flex items-center gap-3 text-xs">
            {message.metadata.duration && <span>{getFormattedDuration(message.metadata.duration)}</span>}
            {message.metadata.tokens && (message.metadata.tokens.prompt || message.metadata.tokens.completion) && (
              <span>
                {message.metadata.tokens.prompt || 0}p / {message.metadata.tokens.completion || 0}c tokens
              </span>
            )}
            {message.metadata.operation && <span className="text-primary-500">{message.metadata.operation}</span>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={classNames("mb-2 flex w-full", isUser ? "justify-end" : "justify-start")}>
      {isUser ? (
        bubbleContent
      ) : (
        <Link to={`/traces/${traceId}/spans/${message.spanId}`} className="max-w-[80%]">
          {bubbleContent}
        </Link>
      )}
    </div>
  );
}

export default function AITranscription() {
  const { traceId } = useParams<{ traceId: string }>();
  const getTraceById = useSentryStore(state => state.getTraceById);
  const { spanId } = useParams<{ spanId?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const { inputValue, showReset, handleChange, handleReset } = useSearchInput(setSearchQuery, 500);

  if (!traceId) {
    return (
      <div className="p-6">
        <p className="text-red-400">No trace ID provided</p>
      </div>
    );
  }

  const trace = getTraceById(traceId);

  // Extract AI traces from the trace
  const aiTraces = useMemo(() => {
    if (!trace?.spanTree) return [];

    const aiRootSpans = extractAllAIRootSpans(trace.spanTree);
    return aiRootSpans
      .map(({ span }) => createAITraceFromSpan(span))
      .filter((aiTrace): aiTrace is SpotlightAITrace => aiTrace !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [trace]);

  const conversation = useMemo(() => {
    return parseAITracesToConversation(aiTraces);
  }, [aiTraces]);

  const filteredConversation = useMemo(() => {
    if (!searchQuery) return conversation;

    const searchLower = searchQuery.toLowerCase();
    return conversation.filter(
      message =>
        message.content.toLowerCase().includes(searchLower) ||
        message.metadata?.operation?.toLowerCase().includes(searchLower) ||
        message.metadata?.toolCall?.toolName.toLowerCase().includes(searchLower),
    );
  }, [conversation, searchQuery]);

  if (!trace) {
    return (
      <div className="p-6">
        <p className="text-red-400">Trace not found</p>
      </div>
    );
  }

  if (conversation.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-primary-300">No AI conversation found in this trace</p>
      </div>
    );
  }

  const totalDuration = trace.timestamp - trace.start_timestamp;
  const aiInteractionCount = aiTraces.length;

  return (
    <div className="flex h-full flex-col">
      {/* Header with trace info */}
      <div className="px-6 py-4 border-b border-primary-700">
        <div className="text-primary-300 flex flex-1 items-center gap-x-1">
          <div className="text-primary-200">
            <DateTime date={trace.start_timestamp} />
          </div>
          <span>&mdash;</span>
          <span>
            <strong className="text-primary-200 font-bold">{getFormattedDuration(totalDuration)}</strong> with{" "}
            <strong className="text-primary-200 font-bold">
              {aiInteractionCount} AI interaction{aiInteractionCount !== 1 ? "s" : ""}
            </strong>
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="mx-6 mb-4 mt-4">
        <div className="bg-primary-950 text-primary-50 border-primary-600 hover:border-primary-500 relative flex h-auto w-full flex-1 gap-2 rounded-md border py-1 pl-4 pr-6 outline-none transition-all">
          <input
            className="text-primary-50 h-auto w-full flex-1 bg-transparent outline-none transition-all"
            onChange={handleChange}
            value={inputValue}
            placeholder="Search conversation..."
          />
          {showReset && (
            <CrossIcon
              onClick={handleReset}
              className="fill-primary-50 absolute right-1 top-[5px] cursor-pointer"
              height={20}
              width={20}
            />
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {filteredConversation.map(message => (
          <ConversationBubble
            key={message.id}
            message={message}
            isSelected={spanId === message.spanId}
            traceId={traceId}
          />
        ))}
      </div>
    </div>
  );
}
