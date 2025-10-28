import type { ErrorEvent } from "@sentry/core";
import logfmt from "logfmt";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(event: unknown): string[] {
  return [logfmt.stringify(buildErrorData(event as ErrorEvent))];
}
