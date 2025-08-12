import { openai } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { ScoreFn } from "vitest-evals";
import { z } from "zod";

const predictionSchema = z.object({
  score: z.number().min(0).max(1).describe("Score from 0 to 1"),
  rationale: z.string().describe("Explanation for the score"),
  predictedTools: z
    .array(
      z.object({
        name: z.string(),
        arguments: z.record(z.any()).optional().default({}),
      }),
    )
    .describe("What tools the AI agent would likely call for this input"),
});

export interface ExpectedToolCall {
  name: string;
  arguments?: Record<string, any>;
}

interface ToolPredictionScorerOptions {
  input: string;
  output: string;
  expectedTools?: ExpectedToolCall[];
  result?: any;
}

const defaultModel = openai("gpt-4o-mini");

function generateSystemPrompt(
  availableTools: string[],
  task: string,
  expectedDescription: string,
): string {
  return `You are evaluating whether an AI assistant with access to Spotlight MCP tools would make the correct tool calls for a given task.

[AVAILABLE TOOLS]
${availableTools.join("\n")}

[TASK]
${task}

[EXPECTED TOOL CALLS]
${expectedDescription}

Based on the task and available tools, predict what tools the AI would call to complete this task.

Consider typical AI assistant behavior:
- For error-related queries, the assistant would likely call get_errors
- The assistant typically responds to keywords like "error", "crash", "fail", "exception", "broken", "wrong", "debug", "errored"
- For non-error queries (performance, network, memory, etc.), it should NOT call get_errors

Score as follows:
- 1.0: All expected tools would be called with correct arguments in the right order
- 0.8: All expected tools would be called, minor differences (extra params, slight variations)
- 0.6: Most expected tools would be called but missing some or wrong order
- 0.3: Some expected tools would be called but significant issues
- 0.0: Wrong tools or critical tools missing`;
}

export function ToolPredictionScorer(model: LanguageModel = defaultModel) {
  return async function ToolPredictionScorer(
    opts: ToolPredictionScorerOptions,
  ) {
    // If expectedTools is not defined, skip this scorer
    if (!opts.expectedTools) {
      return {
        score: null,
        metadata: {
          rationale: "Skipped: No expectedTools defined for this test case",
        },
      };
    }

    const expectedTools = opts.expectedTools;

    // Check if we have an API key for OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not set, using simple keyword matching instead");
      
      // Fallback to simple keyword matching
      const errorKeywords = ["error", "crash", "fail", "exception", "broken", "wrong", "debug", "errored"];
      const hasErrorKeyword = errorKeywords.some(keyword => 
        opts.input.toLowerCase().includes(keyword)
      );
      
      const expectedHasGetErrors = expectedTools.some((t: any) => t.name === "get_errors");
      const match = hasErrorKeyword === expectedHasGetErrors;
      
      return {
        score: match ? 1.0 : 0.0,
        metadata: {
          rationale: match 
            ? "Keywords match expected tool usage" 
            : "Keywords don't match expected tool usage",
        },
      };
    }

    // For simplicity, we'll use a hardcoded tools list since we only have get_errors
    const AVAILABLE_TOOLS = [
      "get_errors - Fetches the most recent errors from Spotlight debugger"
    ];

    // Generate a description of the expected tools for the prompt
    const expectedDescription = expectedTools.length > 0
      ? expectedTools
          .map(
            (tool) =>
              `- ${tool.name}${tool.arguments ? ` with arguments: ${JSON.stringify(tool.arguments)}` : ""}`,
          )
          .join("\n")
      : "Should not call any tools";

    try {
      const { object } = await generateObject({
        model,
        prompt: generateSystemPrompt(
          AVAILABLE_TOOLS,
          opts.input,
          expectedDescription,
        ),
        schema: predictionSchema,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "tool_prediction_scorer",
        },
      });

      return {
        score: object.score,
        metadata: {
          rationale: object.rationale,
          predictedTools: object.predictedTools,
          expectedTools: expectedTools,
        },
      };
    } catch (error) {
      console.error("ToolPredictionScorer error:", error);
      return {
        score: 0,
        metadata: {
          rationale: `Error in tool prediction: ${error}`,
        },
      };
    }
  };
}