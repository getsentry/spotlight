import { describeEval } from "vitest-evals";

describeEval("Simple test", {
  data: async () => {
    return [
      {
        input: "test input",
        expected: "test output",
      },
    ];
  },
  
  task: async (input: string) => {
    return "test output";
  },
  
  scorers: [],
  
  threshold: 0.6,
  timeout: 30000,
});