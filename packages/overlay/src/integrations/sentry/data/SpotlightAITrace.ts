import type { Span, SpanId } from '~/integrations/sentry/types';

export interface AIToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown> | string;
  state?: string;
  step?: number;
}

export interface AIMessage {
  role: string;
  content: string;
  toolInvocations?: AIToolCall[];
  parts?: unknown[];
}

export interface AIPrompt {
  system?: string;
  messages?: AIMessage[];
}

export interface AIResponse {
  finishReason?: string;
  text?: string;
  toolCalls?: AIToolCall[];
}

export interface AIMetadata {
  modelId?: string;
  modelProvider?: string;
  functionId?: string;
  metadata: Record<string, unknown>;
  maxRetries?: number;
  maxSteps?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export class SpotlightAITrace {
  id: string;
  operation: string;
  timestamp: number;
  durationMs: number;
  rootSpan: Span;
  spanTree: Span[];
  metadata: AIMetadata;
  prompt?: AIPrompt;
  response?: AIResponse;
  toolCalls: AIToolCall[];

  constructor(rootSpan: Span) {
    this.id = rootSpan.span_id;
    this.operation = this.determineOperation(rootSpan);
    this.timestamp = rootSpan.start_timestamp;
    this.durationMs = rootSpan.timestamp - rootSpan.start_timestamp;
    this.rootSpan = rootSpan;
    this.spanTree = [rootSpan];
    this.metadata = {
      metadata: {},
    };
    this.toolCalls = [];

    this.parseSpan(rootSpan);
  }

  private determineOperation(span: Span): string {
    if (span.data?.['ai.operationId']) {
      return String(span.data['ai.operationId']);
    }

    if (span.op?.startsWith('ai.')) {
      return span.op;
    }

    if (span.description?.startsWith('ai.')) {
      return span.description;
    }

    return 'AI Interaction';
  }

  private parseSpan(rootSpan: Span): void {
    const allSpans = this.collectAllSpans(rootSpan);

    for (const span of allSpans) {
      if (!span.data) continue;

      // get ai metadata
      if (span.data['ai.model.id']) {
        this.metadata.modelId = String(span.data['ai.model.id']);
      }

      if (span.data['ai.model.provider']) {
        this.metadata.modelProvider = String(span.data['ai.model.provider']);
      }

      if (span.data['ai.telemetry.functionId']) {
        this.metadata.functionId = String(span.data['ai.telemetry.functionId']);
      }

      if (span.data['ai.settings.maxRetries']) {
        this.metadata.maxRetries = Number(span.data['ai.settings.maxRetries']);
      }

      if (span.data['ai.settings.maxSteps']) {
        this.metadata.maxSteps = Number(span.data['ai.settings.maxSteps']);
      }

      if (span.data['ai.usage.promptTokens']) {
        this.metadata.promptTokens = Number(span.data['ai.usage.promptTokens']);
      }

      if (span.data['ai.usage.completionTokens']) {
        this.metadata.completionTokens = Number(span.data['ai.usage.completionTokens']);
      }

      for (const [key, value] of Object.entries(span.data)) {
        if (key.startsWith('ai.telemetry.metadata.')) {
          const metadataKey = key.replace('ai.telemetry.metadata.', '');
          this.metadata.metadata[metadataKey] = value;
        }
      }

      if (span.data['ai.prompt']) {
        try {
          this.prompt = JSON.parse(String(span.data['ai.prompt']));
        } catch (e) {
          this.prompt = { messages: [{ role: 'unknown', content: String(span.data['ai.prompt']) }] };
        }
      }

      this.response = this.response || {};

      if (span.data['ai.response.finishReason']) {
        this.response.finishReason = String(span.data['ai.response.finishReason']);
      }

      if (span.data['ai.response.text']) {
        this.response.text = String(span.data['ai.response.text']);
      }

      if (span.data['ai.response.toolCalls']) {
        this.response.toolCalls = JSON.parse(String(span.data['ai.response.toolCalls']));
      }

      // parse tool calls
      if (span.data['ai.toolCall.name'] && span.data['ai.toolCall.id']) {
        const toolCall: AIToolCall = {
          toolCallId: String(span.data['ai.toolCall.id']),
          toolName: String(span.data['ai.toolCall.name']),
          args: {},
        };

        if (span.data['ai.toolCall.args']) {
          try {
            toolCall.args = JSON.parse(String(span.data['ai.toolCall.args']));
          } catch (e) {
            toolCall.args = { rawArgs: span.data['ai.toolCall.args'] };
          }
        }

        if (span.data['ai.toolCall.result']) {
          try {
            toolCall.result = JSON.parse(String(span.data['ai.toolCall.result']));
          } catch (e) {
            toolCall.result = String(span.data['ai.toolCall.result']);
          }
        }

        this.toolCalls.push(toolCall);
      }
    }
  }

  private collectAllSpans(rootSpan: Span): Span[] {
    const allSpans: Span[] = [];
    const queue: Span[] = [rootSpan];
    const visited = new Set<SpanId>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current.span_id)) {
        continue;
      }

      visited.add(current.span_id);
      allSpans.push(current);

      if (current.children) {
        for (const child of current.children) {
          queue.push(child);
        }
      }
    }

    return allSpans;
  }

  getDisplayTitle(): string {
    return this.rootSpan.description || this.operation || `AI Trace ${this.id.substring(0, 8)}`;
  }

  getTypeBadge(): string {
    if (this.toolCalls.length > 0) {
      return 'Tool-Call';
    }

    if (this.operation === 'ai.streamText') {
      return 'Stream Text';
    }

    if (this.operation === 'ai.generateText') {
      return 'Generate Text';
    }

    return this.operation.replace('ai.', '');
  }

  getTokensDisplay(): string {
    const { promptTokens, completionTokens } = this.metadata;
    if (promptTokens !== undefined && completionTokens !== undefined) {
      return `${promptTokens} / ${completionTokens}`;
    }

    if (promptTokens !== undefined) {
      return `${promptTokens} / ?`;
    }

    if (completionTokens !== undefined) {
      return `? / ${completionTokens}`;
    }

    return 'N/A';
  }
}

export function createAITraceFromSpan(span: Span): SpotlightAITrace {
  return new SpotlightAITrace(span);
}
