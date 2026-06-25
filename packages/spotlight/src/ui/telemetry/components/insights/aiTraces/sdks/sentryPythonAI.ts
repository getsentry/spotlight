import { getAllSpansInTree } from "@spotlight/ui/telemetry/store/helpers";
import type { AILibraryHandler, AIToolCall, Span, SpotlightAITrace } from "@spotlight/ui/telemetry/types";

// sentry-python emits OpenTelemetry `gen_ai.*` spans for its AI integrations
// (PydanticAI, OpenAI, Anthropic, ...). They share the same span format, so a
// single handler covers all of them.
// https://github.com/getsentry/sentry-python/blob/master/sentry_sdk/consts.py
const GEN_AI_OP_PREFIX = "gen_ai.";
const VERCEL_FIELD_PREFIX = "vercel.ai.";

// Span ops (sentry_sdk.consts.OP)
const GEN_AI_CHAT_OP = "gen_ai.chat";
const GEN_AI_INVOKE_AGENT_OP = "gen_ai.invoke_agent";
const GEN_AI_EXECUTE_TOOL_OP = "gen_ai.execute_tool";

// Span data fields (sentry_sdk.consts.SPANDATA)
const GEN_AI_OPERATION_NAME_FIELD = "gen_ai.operation.name";
const GEN_AI_AGENT_NAME_FIELD = "gen_ai.agent.name";
const GEN_AI_SYSTEM_FIELD = "gen_ai.system";
const GEN_AI_REQUEST_MODEL_FIELD = "gen_ai.request.model";
const GEN_AI_RESPONSE_MODEL_FIELD = "gen_ai.response.model";
const GEN_AI_USAGE_INPUT_TOKENS_FIELD = "gen_ai.usage.input_tokens";
const GEN_AI_USAGE_OUTPUT_TOKENS_FIELD = "gen_ai.usage.output_tokens";
const GEN_AI_REQUEST_MESSAGES_FIELD = "gen_ai.request.messages";
const GEN_AI_SYSTEM_INSTRUCTIONS_FIELD = "gen_ai.system_instructions";
const GEN_AI_RESPONSE_TEXT_FIELD = "gen_ai.response.text";
const GEN_AI_RESPONSE_TOOL_CALLS_FIELD = "gen_ai.response.tool_calls";
const GEN_AI_RESPONSE_FINISH_REASONS_FIELD = "gen_ai.response.finish_reasons";
const GEN_AI_TOOL_NAME_FIELD = "gen_ai.tool.name";
const GEN_AI_TOOL_CALL_ID_FIELD = "gen_ai.tool.call.id";
const GEN_AI_TOOL_INPUT_FIELD = "gen_ai.tool.input";
const GEN_AI_TOOL_OUTPUT_FIELD = "gen_ai.tool.output";

const DEFAULT_TRACE_NAME = "AI Interaction";
const UNKNOWN_OPERATION = "N/A";

const OPERATION_BADGE_MAP = new Map<string, string>([
  ["chat", "Chat"],
  ["invoke_agent", "Invoke Agent"],
  ["execute_tool", "Execute Tool"],
  [GEN_AI_CHAT_OP, "Chat"],
  [GEN_AI_INVOKE_AGENT_OP, "Invoke Agent"],
  [GEN_AI_EXECUTE_TOOL_OP, "Execute Tool"],
]);

function isGenAISpan(span: Span): boolean {
  return !!span.op?.toLowerCase().startsWith(GEN_AI_OP_PREFIX);
}

/**
 * Distinguishes sentry-python `gen_ai.*` spans from Vercel AI SDK spans. Both
 * carry the `gen_ai.` op prefix, but only the Vercel SDK sets `vercel.ai.*`
 * data fields. A sentry-python span has at least one `gen_ai.*` data key and no
 * `vercel.ai.*` key.
 */
function isSentryPythonSpan(span: Span): boolean {
  if (!isGenAISpan(span) || !span.data) {
    return false;
  }

  let hasGenAIField = false;
  for (const key of Object.keys(span.data)) {
    if (key.startsWith(VERCEL_FIELD_PREFIX)) {
      return false;
    }
    if (key.startsWith(GEN_AI_OP_PREFIX)) {
      hasGenAIField = true;
    }
  }

  return hasGenAIField;
}

export const sentryPythonAIHandler: AILibraryHandler = {
  id: "sentry-python-gen-ai",
  name: "Sentry Python AI",

  canHandleSpan: isSentryPythonSpan,

  extractRootSpans: (spans: Span[]): Span[] => {
    const resultRoots: Span[] = [];

    const findAndCollectAIRoots = (spansToSearch: Span[]) => {
      for (const currentSpan of spansToSearch) {
        if (isSentryPythonSpan(currentSpan)) {
          resultRoots.push(currentSpan);
        } else if (!isGenAISpan(currentSpan) && currentSpan.children?.length) {
          // Stop at any gen_ai.* span: it's the shallowest AI root for its
          // tree (claimed by this handler or the Vercel one), so its nested
          // gen_ai.* children must not be surfaced as separate roots.
          findAndCollectAIRoots(currentSpan.children);
        }
      }
    };

    findAndCollectAIRoots(spans);
    return resultRoots;
  },

  processTrace: (rootSpan: Span): SpotlightAITrace => {
    const allSpans = getAllSpansInTree(rootSpan);
    const tokenUsage = extractTokenUsage(allSpans);
    const operation = determineOperation(rootSpan);
    const hasToolCall = allSpans.some(
      span => span.op === GEN_AI_EXECUTE_TOOL_OP || !!span.data?.[GEN_AI_TOOL_NAME_FIELD],
    );

    const durationMs = rootSpan.timestamp - rootSpan.start_timestamp;

    const trace: SpotlightAITrace = {
      id: rootSpan.span_id,
      name: determineTraceName(rootSpan),
      operation,
      timestamp: rootSpan.start_timestamp,
      durationMs,
      tokensDisplay: formatTokensDisplay(tokenUsage.promptTokens, tokenUsage.completionTokens),
      promptTokens: tokenUsage.promptTokens,
      completionTokens: tokenUsage.completionTokens,
      hasToolCall,
      rawSpan: rootSpan,
      metadata: {
        metadata: {},
      },
      toolCalls: [],
    };

    for (const span of allSpans) {
      if (!span.data) continue;
      extractMetadata(span, trace);
      extractPromptData(span, trace);
      extractResponseData(span, trace);
      extractToolCallData(span, trace);
    }

    return trace;
  },

  getDisplayTitle: (trace: SpotlightAITrace): string => {
    return trace.name || trace.operation || `AI Trace ${trace.id.substring(0, 8)}`;
  },

  getTypeBadge: (trace: SpotlightAITrace): string => {
    if (trace.hasToolCall) {
      return "Tool-Call";
    }

    return OPERATION_BADGE_MAP.get(trace.operation) ?? trace.operation.replace(/^gen_ai\./, "");
  },

  getTokensDisplay: (trace: SpotlightAITrace): string => {
    return trace.tokensDisplay;
  },
};

function determineOperation(rootSpan: Span): string {
  const operationName = rootSpan.data?.[GEN_AI_OPERATION_NAME_FIELD];
  if (operationName) {
    return String(operationName);
  }
  if (rootSpan.op) {
    return rootSpan.op;
  }
  return UNKNOWN_OPERATION;
}

function determineTraceName(rootSpan: Span): string {
  const agentName = rootSpan.data?.[GEN_AI_AGENT_NAME_FIELD];
  if (agentName) {
    return String(agentName);
  }
  return rootSpan.description || rootSpan.op || DEFAULT_TRACE_NAME;
}

function extractTokenUsage(spans: Span[]): { promptTokens?: number; completionTokens?: number } {
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;

  for (const span of spans) {
    if (!span.data) continue;

    if (promptTokens === undefined && span.data[GEN_AI_USAGE_INPUT_TOKENS_FIELD] !== undefined) {
      promptTokens = Number(span.data[GEN_AI_USAGE_INPUT_TOKENS_FIELD]);
    }

    if (completionTokens === undefined && span.data[GEN_AI_USAGE_OUTPUT_TOKENS_FIELD] !== undefined) {
      completionTokens = Number(span.data[GEN_AI_USAGE_OUTPUT_TOKENS_FIELD]);
    }

    if (promptTokens !== undefined && completionTokens !== undefined) {
      break;
    }
  }

  return { promptTokens, completionTokens };
}

function formatTokensDisplay(promptTokens?: number, completionTokens?: number): string {
  if (promptTokens !== undefined && completionTokens !== undefined) {
    return `${promptTokens} / ${completionTokens}`;
  }
  if (promptTokens !== undefined) {
    return `${promptTokens} / ?`;
  }
  if (completionTokens !== undefined) {
    return `? / ${completionTokens}`;
  }
  return UNKNOWN_OPERATION;
}

/**
 * Normalizes message content from a string or an array of content blocks to a
 * plain string. Only text blocks are surfaced; images/files would need UI work.
 */
function normalizeMessageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (block): block is { type: string; text: string } => block?.type === "text" && typeof block.text === "string",
      )
      .map(block => block.text)
      .join("");
  }
  return "";
}

function extractMetadata(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  if (trace.metadata.modelId === undefined) {
    const modelId = span.data[GEN_AI_REQUEST_MODEL_FIELD] ?? span.data[GEN_AI_RESPONSE_MODEL_FIELD];
    if (modelId !== undefined) {
      trace.metadata.modelId = String(modelId);
    }
  }

  if (trace.metadata.modelProvider === undefined && span.data[GEN_AI_SYSTEM_FIELD] !== undefined) {
    trace.metadata.modelProvider = String(span.data[GEN_AI_SYSTEM_FIELD]);
  }

  if (trace.metadata.promptTokens === undefined && span.data[GEN_AI_USAGE_INPUT_TOKENS_FIELD] !== undefined) {
    trace.metadata.promptTokens = Number(span.data[GEN_AI_USAGE_INPUT_TOKENS_FIELD]);
  }

  if (trace.metadata.completionTokens === undefined && span.data[GEN_AI_USAGE_OUTPUT_TOKENS_FIELD] !== undefined) {
    trace.metadata.completionTokens = Number(span.data[GEN_AI_USAGE_OUTPUT_TOKENS_FIELD]);
  }
}

function extractPromptData(span: Span, trace: SpotlightAITrace) {
  if (!span.data || trace.prompt) return;

  const promptMessages = span.data[GEN_AI_REQUEST_MESSAGES_FIELD];
  if (promptMessages === undefined) return;

  const system = span.data[GEN_AI_SYSTEM_INSTRUCTIONS_FIELD];
  const systemText = system !== undefined ? String(system) : undefined;

  try {
    const messages = typeof promptMessages === "string" ? JSON.parse(promptMessages) : promptMessages;
    if (Array.isArray(messages)) {
      const normalizedMessages = messages.map((msg: { role: string; content: unknown }) => ({
        ...msg,
        content: normalizeMessageContent(msg.content),
      }));
      trace.prompt = { messages: normalizedMessages, system: systemText };
      return;
    }
  } catch {
    // fall through to the raw representation below
  }

  trace.prompt = { messages: [{ role: "unknown", content: String(promptMessages) }], system: systemText };
}

function extractResponseData(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  trace.response = trace.response || {};

  const finishReasons = span.data[GEN_AI_RESPONSE_FINISH_REASONS_FIELD];
  if (!trace.response.finishReason) {
    if (Array.isArray(finishReasons) && finishReasons.length > 0) {
      trace.response.finishReason = String(finishReasons[0]);
    } else if (typeof finishReasons === "string" && finishReasons) {
      trace.response.finishReason = finishReasons;
    }
  }

  const responseText = span.data[GEN_AI_RESPONSE_TEXT_FIELD];
  if (responseText && !trace.response.text) {
    trace.response.text = Array.isArray(responseText) ? responseText.map(String).join("") : String(responseText);
  }

  const toolCalls = span.data[GEN_AI_RESPONSE_TOOL_CALLS_FIELD];
  if (toolCalls && !trace.response.toolCalls) {
    try {
      trace.response.toolCalls = typeof toolCalls === "string" ? JSON.parse(toolCalls) : (toolCalls as AIToolCall[]);
    } catch {
      // ignore unparseable tool call payloads
    }
  }
}

function extractToolCallData(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  const toolName = span.data[GEN_AI_TOOL_NAME_FIELD];
  if (!toolName) return;

  const toolCallId = span.data[GEN_AI_TOOL_CALL_ID_FIELD];
  const toolCall: Partial<AIToolCall> = {
    toolCallId: toolCallId ? String(toolCallId) : span.span_id,
    toolName: String(toolName),
    args: {} as Record<string, unknown>,
  };

  const toolInput = span.data[GEN_AI_TOOL_INPUT_FIELD];
  if (toolInput) {
    try {
      toolCall.args = typeof toolInput === "string" ? JSON.parse(toolInput) : (toolInput as Record<string, unknown>);
    } catch {
      toolCall.args = { input: toolInput };
    }
  }

  const toolOutput = span.data[GEN_AI_TOOL_OUTPUT_FIELD];
  if (toolOutput) {
    try {
      toolCall.result = typeof toolOutput === "string" ? JSON.parse(toolOutput) : toolOutput;
    } catch {
      toolCall.result = String(toolOutput);
    }
  }

  trace.toolCalls.push(toolCall as AIToolCall);
}
