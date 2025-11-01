import { getAllSpansInTree } from "~/telemetry/store/helpers";
import type { AILibraryHandler, AIToolCall, Span, SpotlightAITrace } from "~/telemetry/types";

// https://ai-sdk.dev/docs/ai-sdk-core/telemetry
const AI_SPAN_OP_PREFIX = "gen_ai.";
const AI_OPERATION_ID_FIELD = "vercel.ai.operationId";
const AI_OPERATION_NAME_FIELD = "operation.name";

// Tool call related constants (OpenTelemetry semantic conventions)
const AI_TOOL_CALL_OPERATION = "ai.toolCall";
const AI_EXECUTE_TOOL_OPERATION = "gen_ai.execute_tool";
const GEN_AI_TOOL_NAME_FIELD = "gen_ai.tool.name";
const GEN_AI_TOOL_CALL_ID_FIELD = "gen_ai.tool.call.id";
const GEN_AI_TOOL_INPUT_FIELD = "gen_ai.tool.input";
const GEN_AI_TOOL_OUTPUT_FIELD = "gen_ai.tool.output";

const AI_MODEL_ID_FIELD = "vercel.ai.model.id";
const AI_MODEL_PROVIDER_FIELD = "vercel.ai.model.provider";
const AI_SETTINGS_MAX_RETRIES_FIELD = "vercel.ai.settings.maxRetries";
const AI_SETTINGS_MAX_STEPS_FIELD = "vercel.ai.settings.maxSteps";
const AI_TELEMETRY_FUNCTION_ID_FIELD = "vercel.ai.telemetry.functionId";
const AI_TELEMETRY_METADATA_PREFIX = "vercel.ai.telemetry.metadata.";
const AI_PROMPT_FIELD = "vercel.ai.prompt";
const AI_PROMPT_MESSAGES_FIELD = "gen_ai.request.messages";
const AI_RESPONSE_FINISH_REASON_FIELD = "vercel.ai.response.finishReason";
const GEN_AI_RESPONSE_FINISH_REASONS_FIELD = "gen_ai.response.finish_reasons";
const AI_RESPONSE_TEXT_FIELD = "gen_ai.response.text";
const AI_RESPONSE_TOOL_CALLS_FIELD = "vercel.ai.response.toolCalls";

const AI_STREAM_TEXT_OPERATION = "ai.streamText";
const AI_GENERATE_TEXT_OPERATION = "ai.generateText";

const AI_USAGE_PROMPT_TOKENS_FIELD = "vercel.ai.usage.promptTokens";
const AI_USAGE_COMPLETION_TOKENS_FIELD = "vercel.ai.usage.completionTokens";
const GEN_AI_USAGE_INPUT_TOKENS_FIELD = "gen_ai.usage.input_tokens";
const GEN_AI_USAGE_OUTPUT_TOKENS_FIELD = "gen_ai.usage.output_tokens";

const TOKEN_FIELDS = {
  PROMPT: [AI_USAGE_PROMPT_TOKENS_FIELD, GEN_AI_USAGE_INPUT_TOKENS_FIELD],
  COMPLETION: [AI_USAGE_COMPLETION_TOKENS_FIELD, GEN_AI_USAGE_OUTPUT_TOKENS_FIELD],
} as const;

// Other constants
const DEFAULT_TRACE_NAME = "AI Interaction";
const UNKNOWN_OPERATION = "N/A";

export const vercelAISDKHandler: AILibraryHandler = {
  id: "vercel-ai-sdk",
  name: "Vercel AI SDK",

  canHandleSpan: (span: Span): boolean => {
    return !!span.op?.toLowerCase().startsWith(AI_SPAN_OP_PREFIX);
  },

  extractRootSpans: (spans: Span[]): Span[] => {
    const resultRoots: Span[] = [];

    const findAndCollectAIRoots = (spansToSearch: Span[]) => {
      for (const currentSpan of spansToSearch) {
        if (currentSpan.op?.toLowerCase().startsWith(AI_SPAN_OP_PREFIX)) {
          resultRoots.push(currentSpan);
        } else if (currentSpan.children?.length) {
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
    const operationInfo = determineOperation(allSpans, rootSpan);
    const traceName = determineTraceName(rootSpan, operationInfo);

    const durationMs = rootSpan.timestamp - rootSpan.start_timestamp;

    // Initialize the trace with basic properties
    const trace: SpotlightAITrace = {
      id: rootSpan.span_id,
      name: traceName,
      operation: operationInfo.operation,
      timestamp: rootSpan.start_timestamp,
      durationMs,
      tokensDisplay: formatTokensDisplay(tokenUsage.promptTokens, tokenUsage.completionTokens),
      promptTokens: tokenUsage.promptTokens,
      completionTokens: tokenUsage.completionTokens,
      hasToolCall: operationInfo.hasToolCall,
      rawSpan: rootSpan,
      metadata: {
        metadata: {},
      },
      toolCalls: [],
    };

    // Parse detailed span data
    parseSpanData(allSpans, trace);

    return trace;
  },

  getDisplayTitle: (trace: SpotlightAITrace): string => {
    return trace.name || trace.operation || `AI Trace ${trace.id.substring(0, 8)}`;
  },

  getTypeBadge: (trace: SpotlightAITrace): string => {
    if (trace.hasToolCall) {
      return "Tool-Call";
    }

    if (trace.operation === AI_STREAM_TEXT_OPERATION) {
      return "Stream Text";
    }

    if (trace.operation === AI_GENERATE_TEXT_OPERATION) {
      return "Generate Text";
    }

    return trace.operation.replace(/^(ai\.|gen_ai\.)/, "");
  },

  getTokensDisplay: (trace: SpotlightAITrace): string => {
    return trace.tokensDisplay;
  },
};

function extractTokenUsage(spans: Span[]): { promptTokens?: number; completionTokens?: number } {
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;

  for (const span of spans) {
    if (!span.data) continue;

    if (promptTokens === undefined) {
      for (const field of TOKEN_FIELDS.PROMPT) {
        const value = span.data[field];
        if (value !== undefined) {
          promptTokens = Number(value);
          break;
        }
      }
    }

    if (completionTokens === undefined) {
      for (const field of TOKEN_FIELDS.COMPLETION) {
        const value = span.data[field];
        if (value !== undefined) {
          completionTokens = Number(value);
          break;
        }
      }
    }

    if (promptTokens !== undefined && completionTokens !== undefined) {
      break;
    }
  }

  return { promptTokens, completionTokens };
}

function determineOperation(
  spans: Span[],
  rootSpan: Span,
): { operation: string; hasToolCall: boolean; toolCallName?: string } {
  let operation = UNKNOWN_OPERATION;
  let hasToolCall = false;
  let toolCallName: string | undefined;
  let foundToolCallAsOperationId = false;

  for (const span of spans) {
    if (span.op === AI_TOOL_CALL_OPERATION || span.op === AI_EXECUTE_TOOL_OPERATION) {
      hasToolCall = true;
    }

    if (!span.data) continue;

    const operationId = (span.data[AI_OPERATION_ID_FIELD] || span.data[AI_OPERATION_NAME_FIELD]) as string | undefined;

    // Handle tool call operation
    if (operationId === AI_TOOL_CALL_OPERATION) {
      operation = AI_TOOL_CALL_OPERATION;
      foundToolCallAsOperationId = true;
      hasToolCall = true;

      if (span.data[GEN_AI_TOOL_NAME_FIELD]) {
        toolCallName = String(span.data[GEN_AI_TOOL_NAME_FIELD]);
      }
    }

    // Handle other operations (prioritize root and direct children)
    if (!foundToolCallAsOperationId && operationId && operation === UNKNOWN_OPERATION) {
      const isHighPriority =
        span.span_id === rootSpan.span_id || rootSpan.children?.some(child => child.span_id === span.span_id);

      if (isHighPriority) {
        operation = operationId;
      }
    }
  }

  // Fallback logic
  if (operation === UNKNOWN_OPERATION) {
    if (rootSpan.op) {
      operation = rootSpan.op;
    } else if (rootSpan.description) {
      operation = rootSpan.description;
    }
  }

  return { operation, hasToolCall, toolCallName };
}

function determineTraceName(rootSpan: Span, operationInfo: { toolCallName?: string }): string {
  if (operationInfo.toolCallName) {
    return operationInfo.toolCallName;
  }

  return rootSpan.description || rootSpan.op || DEFAULT_TRACE_NAME;
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

function parseSpanData(spans: Span[], trace: SpotlightAITrace) {
  for (const span of spans) {
    if (!span.data) continue;

    extractAIMetadata(span, trace);
    extractTelemetryMetadata(span, trace);
    extractPromptData(span, trace);
    extractResponseData(span, trace);
    extractToolCallData(span, trace);
  }
}

function extractAIMetadata(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  if (span.data[AI_MODEL_ID_FIELD]) {
    trace.metadata.modelId = String(span.data[AI_MODEL_ID_FIELD]);
  }

  if (span.data[AI_MODEL_PROVIDER_FIELD]) {
    trace.metadata.modelProvider = String(span.data[AI_MODEL_PROVIDER_FIELD]);
  }

  if (span.data[AI_TELEMETRY_FUNCTION_ID_FIELD]) {
    trace.metadata.functionId = String(span.data[AI_TELEMETRY_FUNCTION_ID_FIELD]);
  }

  if (span.data[AI_SETTINGS_MAX_RETRIES_FIELD]) {
    trace.metadata.maxRetries = Number(span.data[AI_SETTINGS_MAX_RETRIES_FIELD]);
  }

  if (span.data[AI_SETTINGS_MAX_STEPS_FIELD]) {
    trace.metadata.maxSteps = Number(span.data[AI_SETTINGS_MAX_STEPS_FIELD]);
  }

  if (span.data[AI_USAGE_PROMPT_TOKENS_FIELD]) {
    trace.metadata.promptTokens = Number(span.data[AI_USAGE_PROMPT_TOKENS_FIELD]);
  }

  if (span.data[AI_USAGE_COMPLETION_TOKENS_FIELD]) {
    trace.metadata.completionTokens = Number(span.data[AI_USAGE_COMPLETION_TOKENS_FIELD]);
  }
}

function extractTelemetryMetadata(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  for (const [key, value] of Object.entries(span.data)) {
    if (key.startsWith(AI_TELEMETRY_METADATA_PREFIX)) {
      const metadataKey = key.replace(AI_TELEMETRY_METADATA_PREFIX, "");
      trace.metadata.metadata[metadataKey] = value;
    }
  }
}

function extractPromptData(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  const promptField = span.data[AI_PROMPT_FIELD];
  if (promptField) {
    try {
      trace.prompt = JSON.parse(String(promptField));
    } catch {
      trace.prompt = { messages: [{ role: "unknown", content: String(promptField) }] };
    }
  }

  const promptMessages = span.data[AI_PROMPT_MESSAGES_FIELD];
  if (promptMessages && !trace.prompt) {
    try {
      const messages = JSON.parse(String(promptMessages));
      trace.prompt = { messages };
    } catch {
      trace.prompt = { messages: [{ role: "unknown", content: String(promptMessages) }] };
    }
  }
}

function extractResponseData(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  trace.response = trace.response || {};

  const finishReason = span.data[AI_RESPONSE_FINISH_REASON_FIELD];
  if (finishReason) {
    trace.response.finishReason = String(finishReason);
  }

  const finishReasons = span.data[GEN_AI_RESPONSE_FINISH_REASONS_FIELD];
  if (!trace.response.finishReason && Array.isArray(finishReasons) && finishReasons.length > 0) {
    trace.response.finishReason = String(finishReasons[0]);
  }

  const responseText = span.data[AI_RESPONSE_TEXT_FIELD];
  if (responseText) {
    trace.response.text = String(responseText);
  }

  const toolCalls = span.data[AI_RESPONSE_TOOL_CALLS_FIELD];
  if (toolCalls) {
    trace.response.toolCalls = JSON.parse(String(toolCalls));
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
