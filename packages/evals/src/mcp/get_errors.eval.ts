import { describeEval } from "vitest-evals";
import { getMcpClient } from "../setup-env";
import { NoOpTaskRunner } from "../utils/NoOpTaskRunner";
import { ToolPredictionScorer } from "../utils/ToolPredictionScorer";

describeEval("MCP get_errors tool", {
  data: async () => {
    return [
      // Test cases where the tool SHOULD be triggered
      {
        input: "the page errored out",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "show me the errors",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "what went wrong with my app",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "is there an error on the page",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "debug the crash",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "why did it fail",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "check for exceptions",
        expectedTools: [{ name: "get_errors" }],
      },
      {
        input: "my application is broken",
        expectedTools: [{ name: "get_errors" }],
      },
      
      // Test cases where the tool SHOULD NOT be triggered
      {
        input: "how's the performance",
        expectedTools: [],
      },
      {
        input: "show me the network requests",
        expectedTools: [],
      },
      {
        input: "what's the current memory usage",
        expectedTools: [],
      },
      {
        input: "analyze the page load time",
        expectedTools: [],
      },
    ];
  },
  
  task: NoOpTaskRunner(),
  
  scorers: [ToolPredictionScorer()],
  
  threshold: 0.6,
  timeout: 30000,
});