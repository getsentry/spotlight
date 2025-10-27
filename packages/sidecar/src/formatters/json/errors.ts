import type { ErrorEvent } from "@sentry/core";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(event: ErrorEvent): string[] {
  return [JSON.stringify(buildErrorData(event))];
}
