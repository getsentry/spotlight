/**
 * NoOpTaskRunner - a task runner that doesn't execute any actual operations
 * Used for tool prediction tests where we only want to evaluate if the correct
 * tools would be called, without actually executing them.
 */
export function NoOpTaskRunner() {
  return async (input: string) => {
    // Just return the input as the output
    // vitest-evals expects the task to return a string for the 'output' parameter
    return input;
  };
}