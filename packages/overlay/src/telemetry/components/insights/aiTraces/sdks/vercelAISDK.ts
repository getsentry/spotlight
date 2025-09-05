import { getAllSpansInTree } from "~/telemetry/store/helpers";
import type { AILibraryHandler, AIToolCall, Span, SpotlightAITrace } from "~/telemetry/types";

// https://ai-sdk.dev/docs/ai-sdk-core/telemetry
// Core AI operation constants
const AI_SPAN_DESCRIPTION_PREFIX = "ai."; // all vercel ai sdk start with "ai."
const AI_OPERATION_ID_FIELD = "ai.operationId";

// Tool call related constants
const AI_TOOL_CALL_OPERATION = "ai.toolCall";
const AI_TOOL_CALL_NAME_FIELD = "ai.toolCall.name";
const AI_TOOL_CALL_ID_FIELD = "ai.toolCall.id";
const AI_TOOL_CALL_ARGS_FIELD = "ai.toolCall.args";
const AI_TOOL_CALL_RESULT_FIELD = "ai.toolCall.result";

// Model metadata fields
const AI_MODEL_ID_FIELD = "ai.model.id";
const AI_MODEL_PROVIDER_FIELD = "ai.model.provider";

// Settings fields
const AI_SETTINGS_MAX_RETRIES_FIELD = "ai.settings.maxRetries";
const AI_SETTINGS_MAX_STEPS_FIELD = "ai.settings.maxSteps";

// Telemetry fields
const AI_TELEMETRY_FUNCTION_ID_FIELD = "ai.telemetry.functionId";
const AI_TELEMETRY_METADATA_PREFIX = "ai.telemetry.metadata.";

// Prompt and response fields (matching SpotlightAITrace prompt/response)
const AI_PROMPT_FIELD = "ai.prompt";
const AI_RESPONSE_FINISH_REASON_FIELD = "ai.response.finishReason";
const AI_RESPONSE_TEXT_FIELD = "ai.response.text";
const AI_RESPONSE_TOOL_CALLS_FIELD = "ai.response.toolCalls";

// Operation types
const AI_STREAM_TEXT_OPERATION = "ai.streamText";
const AI_GENERATE_TEXT_OPERATION = "ai.generateText";

// Token usage field constants
const AI_USAGE_PROMPT_TOKENS_FIELD = "ai.usage.promptTokens";
const AI_USAGE_COMPLETION_TOKENS_FIELD = "ai.usage.completionTokens";
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
    return !!span.description?.toLowerCase().startsWith(AI_SPAN_DESCRIPTION_PREFIX);
  },

  extractRootSpans: (spans: Span[]): Span[] => {
    const resultRoots: Span[] = [];

    const findAndCollectAIRoots = (spansToSearch: Span[]) => {
      for (const currentSpan of spansToSearch) {
        if (currentSpan.description?.toLowerCase().startsWith(AI_SPAN_DESCRIPTION_PREFIX)) {
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

    return trace.operation.replace(AI_SPAN_DESCRIPTION_PREFIX, "");
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
    // check for tool call by operation field
    if (span.op === AI_TOOL_CALL_OPERATION) {
      hasToolCall = true;
    }

    if (!span.data) continue;

    const operationId = span.data[AI_OPERATION_ID_FIELD] as string | undefined;

    // Handle tool call operation
    if (operationId === AI_TOOL_CALL_OPERATION) {
      operation = AI_TOOL_CALL_OPERATION;
      foundToolCallAsOperationId = true;
      hasToolCall = true;

      if (span.data[AI_TOOL_CALL_NAME_FIELD]) {
        toolCallName = String(span.data[AI_TOOL_CALL_NAME_FIELD]);
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
    } else if (rootSpan.description?.startsWith(AI_SPAN_DESCRIPTION_PREFIX)) {
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

  if (span.data[AI_PROMPT_FIELD]) {
    try {
      trace.prompt = JSON.parse(String(span.data[AI_PROMPT_FIELD]));
    } catch {
      trace.prompt = { messages: [{ role: "unknown", content: String(span.data[AI_PROMPT_FIELD]) }] };
    }
  }
}

function extractResponseData(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  trace.response = trace.response || {};

  if (span.data[AI_RESPONSE_FINISH_REASON_FIELD]) {
    trace.response.finishReason = String(span.data[AI_RESPONSE_FINISH_REASON_FIELD]);
  }

  if (span.data[AI_RESPONSE_TEXT_FIELD]) {
    trace.response.text = String(span.data[AI_RESPONSE_TEXT_FIELD]);
  }

  if (span.data[AI_RESPONSE_TOOL_CALLS_FIELD]) {
    trace.response.toolCalls = JSON.parse(String(span.data[AI_RESPONSE_TOOL_CALLS_FIELD]));
  }
}

function extractToolCallData(span: Span, trace: SpotlightAITrace) {
  if (!span.data) return;

  if (span.data[AI_TOOL_CALL_NAME_FIELD] && span.data[AI_TOOL_CALL_ID_FIELD]) {
    const toolCall: Partial<AIToolCall> = {
      toolCallId: String(span.data[AI_TOOL_CALL_ID_FIELD]),
      toolName: String(span.data[AI_TOOL_CALL_NAME_FIELD]),
      args: {} as Record<string, unknown>,
    };

    if (span.data[AI_TOOL_CALL_ARGS_FIELD]) {
      try {
        toolCall.args = JSON.parse(String(span.data[AI_TOOL_CALL_ARGS_FIELD]));
      } catch {
        toolCall.args = { rawArgs: span.data[AI_TOOL_CALL_ARGS_FIELD] };
      }
    }

    if (span.data[AI_TOOL_CALL_RESULT_FIELD]) {
      try {
        toolCall.result = JSON.parse(String(span.data[AI_TOOL_CALL_RESULT_FIELD]));
      } catch {
        toolCall.result = String(span.data[AI_TOOL_CALL_RESULT_FIELD]);
      }
    }

    trace.toolCalls.push(toolCall as AIToolCall);
  }
}
