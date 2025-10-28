import type { ErrorEvent } from "@sentry/core";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(event: unknown): string[] {
  return [JSON.stringify(buildErrorData(event as ErrorEvent))];
}
