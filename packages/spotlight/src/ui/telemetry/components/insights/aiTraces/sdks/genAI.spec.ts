import type { Span } from "@spotlight/ui/telemetry/types";
import { describe, expect, test } from "vitest";
import { detectAILibraryHandler, extractAllAIRootSpans } from "./aiLibraries";
import { genAIHandler } from "./genAI";
import { vercelAISDKHandler } from "./vercelAISDK";

function mockSpan(span: Partial<Span> = {}): Span {
  const start = 1000;
  return {
    span_id: "span-1",
    op: "gen_ai.chat",
    start_timestamp: start,
    timestamp: start + 2,
    ...span,
  };
}

// Mirrors what sentry-python's PydanticAIIntegration emits.
function pydanticChatSpan(overrides: Partial<Span> = {}): Span {
  return mockSpan({
    span_id: "pydantic-chat",
    op: "gen_ai.chat",
    description: "chat gpt-4o",
    data: {
      "gen_ai.operation.name": "chat",
      "gen_ai.system": "openai",
      "gen_ai.request.model": "gpt-4o",
      "gen_ai.response.model": "gpt-4o-2024-08-06",
      "gen_ai.usage.input_tokens": 42,
      "gen_ai.usage.output_tokens": 17,
      "gen_ai.request.messages": JSON.stringify([{ role: "user", content: [{ type: "text", text: "hi" }] }]),
      "gen_ai.response.text": ["hello there"],
      "gen_ai.response.finish_reasons": ["stop"],
    },
    ...overrides,
  });
}

describe("genAIHandler", () => {
  describe("canHandleSpan", () => {
    test("claims standard gen_ai spans regardless of provider", () => {
      expect(genAIHandler.canHandleSpan(pydanticChatSpan())).toBe(true);
    });

    test("ignores Vercel AI SDK spans (which carry vercel.ai.* fields)", () => {
      const vercelSpan = mockSpan({
        op: "gen_ai.invoke_agent",
        data: {
          "vercel.ai.operationId": "ai.streamText",
          "gen_ai.usage.input_tokens": 10,
        },
      });
      expect(genAIHandler.canHandleSpan(vercelSpan)).toBe(false);
    });

    test("ignores non gen_ai spans", () => {
      expect(genAIHandler.canHandleSpan(mockSpan({ op: "http.client", data: {} }))).toBe(false);
    });

    test("ignores gen_ai spans with no gen_ai data fields", () => {
      expect(genAIHandler.canHandleSpan(mockSpan({ op: "gen_ai.chat", data: {} }))).toBe(false);
    });
  });

  describe("processTrace", () => {
    test("extracts model, provider, tokens, prompt and response", () => {
      const trace = genAIHandler.processTrace(pydanticChatSpan());

      expect(trace.operation).toBe("chat");
      expect(trace.metadata.modelId).toBe("gpt-4o");
      expect(trace.metadata.modelProvider).toBe("openai");
      expect(trace.promptTokens).toBe(42);
      expect(trace.completionTokens).toBe(17);
      expect(trace.tokensDisplay).toBe("42 / 17");
      expect(trace.prompt?.messages?.[0]).toEqual({ role: "user", content: "hi" });
      expect(trace.response?.text).toBe("hello there");
      expect(trace.response?.finishReason).toBe("stop");
    });

    test("collects tool calls and flags hasToolCall", () => {
      const root = mockSpan({
        span_id: "agent",
        op: "gen_ai.invoke_agent",
        data: { "gen_ai.agent.name": "weather-agent", "gen_ai.operation.name": "invoke_agent" },
        children: [
          mockSpan({
            span_id: "tool",
            op: "gen_ai.execute_tool",
            data: {
              "gen_ai.tool.name": "get_weather",
              "gen_ai.tool.call.id": "call_1",
              "gen_ai.tool.input": JSON.stringify({ city: "Paris" }),
              "gen_ai.tool.output": "sunny",
            },
          }),
        ],
      });

      const trace = genAIHandler.processTrace(root);
      expect(trace.name).toBe("weather-agent");
      expect(trace.hasToolCall).toBe(true);
      expect(trace.toolCalls).toHaveLength(1);
      expect(trace.toolCalls[0]).toMatchObject({
        toolCallId: "call_1",
        toolName: "get_weather",
        args: { city: "Paris" },
        result: "sunny",
      });
    });
  });

  test("response text reflects the last chat turn, not the first", () => {
    const root = mockSpan({
      span_id: "agent",
      op: "gen_ai.invoke_agent",
      data: { "gen_ai.agent.name": "assistant", "gen_ai.operation.name": "invoke_agent" },
      children: [
        mockSpan({
          span_id: "chat-1",
          op: "gen_ai.chat",
          data: { "gen_ai.response.text": ["first reply"], "gen_ai.response.finish_reasons": ["tool_calls"] },
        }),
        mockSpan({
          span_id: "chat-2",
          op: "gen_ai.chat",
          data: { "gen_ai.response.text": ["final reply"], "gen_ai.response.finish_reasons": ["stop"] },
        }),
      ],
    });

    const trace = genAIHandler.processTrace(root);
    expect(trace.response?.text).toBe("final reply");
    expect(trace.response?.finishReason).toBe("stop");
  });

  test("sums token usage across multiple chat turns", () => {
    const root = mockSpan({
      span_id: "agent",
      op: "gen_ai.invoke_agent",
      data: { "gen_ai.agent.name": "assistant", "gen_ai.operation.name": "invoke_agent" },
      children: [
        mockSpan({
          span_id: "chat-1",
          op: "gen_ai.chat",
          data: { "gen_ai.usage.input_tokens": 10, "gen_ai.usage.output_tokens": 4 },
        }),
        mockSpan({
          span_id: "chat-2",
          op: "gen_ai.chat",
          data: { "gen_ai.usage.input_tokens": 25, "gen_ai.usage.output_tokens": 9 },
        }),
      ],
    });

    const trace = genAIHandler.processTrace(root);
    expect(trace.promptTokens).toBe(35);
    expect(trace.completionTokens).toBe(13);
    expect(trace.metadata.promptTokens).toBe(35);
    expect(trace.metadata.completionTokens).toBe(13);
    expect(trace.tokensDisplay).toBe("35 / 13");
  });

  describe("getTypeBadge", () => {
    test("maps known operations", () => {
      const trace = genAIHandler.processTrace(pydanticChatSpan());
      expect(genAIHandler.getTypeBadge(trace)).toBe("Chat");
    });
  });
});

describe("aiLibraries registry", () => {
  test("routes standard gen_ai spans to the generic handler, not Vercel", () => {
    const handler = detectAILibraryHandler(pydanticChatSpan());
    expect(handler?.id).toBe(genAIHandler.id);
  });

  test("still routes Vercel spans to the Vercel handler", () => {
    const vercelSpan = mockSpan({
      op: "gen_ai.invoke_agent",
      data: { "vercel.ai.operationId": "ai.streamText" },
    });
    const handler = detectAILibraryHandler(vercelSpan);
    expect(handler?.id).toBe(vercelAISDKHandler.id);
  });

  test("does not surface the same gen_ai root span twice", () => {
    const roots = extractAllAIRootSpans([pydanticChatSpan()]);
    expect(roots).toHaveLength(1);
    expect(roots[0].handler.id).toBe(genAIHandler.id);
  });

  test("does not surface nested gen_ai children of a Vercel root as extra roots", () => {
    // A Vercel agent span (carries vercel.ai.*) with a nested gen_ai.chat
    // child that lacks vercel.ai.* fields. Only the Vercel root should surface.
    const vercelAgent = mockSpan({
      span_id: "vercel-agent",
      op: "gen_ai.invoke_agent",
      data: { "vercel.ai.operationId": "ai.streamText", "gen_ai.usage.input_tokens": 5 },
      children: [
        mockSpan({
          span_id: "nested-chat",
          op: "gen_ai.chat",
          data: { "gen_ai.operation.name": "chat", "gen_ai.usage.input_tokens": 5 },
        }),
      ],
    });

    const roots = extractAllAIRootSpans([vercelAgent]);
    expect(roots).toHaveLength(1);
    expect(roots[0].span.span_id).toBe("vercel-agent");
    expect(roots[0].handler.id).toBe(vercelAISDKHandler.id);
  });
});
