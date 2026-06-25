import type { Span } from "@spotlight/ui/telemetry/types";
import { describe, expect, test } from "vitest";
import { detectAILibraryHandler, extractAllAIRootSpans } from "./aiLibraries";
import { sentryPythonAIHandler } from "./sentryPythonAI";
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

describe("sentryPythonAIHandler", () => {
  describe("canHandleSpan", () => {
    test("claims sentry-python gen_ai spans", () => {
      expect(sentryPythonAIHandler.canHandleSpan(pydanticChatSpan())).toBe(true);
    });

    test("ignores Vercel AI SDK spans (which carry vercel.ai.* fields)", () => {
      const vercelSpan = mockSpan({
        op: "gen_ai.invoke_agent",
        data: {
          "vercel.ai.operationId": "ai.streamText",
          "gen_ai.usage.input_tokens": 10,
        },
      });
      expect(sentryPythonAIHandler.canHandleSpan(vercelSpan)).toBe(false);
    });

    test("ignores non gen_ai spans", () => {
      expect(sentryPythonAIHandler.canHandleSpan(mockSpan({ op: "http.client", data: {} }))).toBe(false);
    });

    test("ignores gen_ai spans with no gen_ai data fields", () => {
      expect(sentryPythonAIHandler.canHandleSpan(mockSpan({ op: "gen_ai.chat", data: {} }))).toBe(false);
    });
  });

  describe("processTrace", () => {
    test("extracts model, provider, tokens, prompt and response", () => {
      const trace = sentryPythonAIHandler.processTrace(pydanticChatSpan());

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

      const trace = sentryPythonAIHandler.processTrace(root);
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

  describe("getTypeBadge", () => {
    test("maps known operations", () => {
      const trace = sentryPythonAIHandler.processTrace(pydanticChatSpan());
      expect(sentryPythonAIHandler.getTypeBadge(trace)).toBe("Chat");
    });
  });
});

describe("aiLibraries registry", () => {
  test("routes sentry-python spans to the python handler, not Vercel", () => {
    const handler = detectAILibraryHandler(pydanticChatSpan());
    expect(handler?.id).toBe(sentryPythonAIHandler.id);
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
    expect(roots[0].handler.id).toBe(sentryPythonAIHandler.id);
  });
});
