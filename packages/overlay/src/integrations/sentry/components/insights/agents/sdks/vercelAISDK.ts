import { getAllSpansInTree } from '~/integrations/sentry/data/SpotlightAITrace';
import type { AILibraryHandler, Span, SpotlightAITrace } from '~/integrations/sentry/types';

// https://ai-sdk.dev/docs/ai-sdk-core/telemetry
const AI_SPAN_DESCRIPTION_PREFIX = 'ai.'; // all vercel ai sdk start with "ai."
const AI_TOOL_CALL_NAME_FIELD = 'ai.toolCall.name';
const AI_TOOL_CALL_OPERATION = 'ai.toolCall';
const AI_OPERATION_ID_FIELD = 'ai.operationId';
const DEFAULT_TRACE_NAME = 'AI Interaction';
const UNKNOWN_OPERATION = 'N/A';

const TOKEN_FIELDS = {
  PROMPT: ['ai.usage.promptTokens', 'gen_ai.usage.input_tokens'],
  COMPLETION: ['ai.usage.completionTokens', 'gen_ai.usage.output_tokens'],
} as const;

export const vercelAISDKHandler: AILibraryHandler = {
  id: 'vercel-ai-sdk',
  name: 'Vercel AI SDK',

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

    return {
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
    };
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
