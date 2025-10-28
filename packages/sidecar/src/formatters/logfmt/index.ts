import type { FormatterFunction } from "../types.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

export const formatters = new Map<string, FormatterFunction>([
  ["event", formatError],
  ["transaction", formatTrace],
  ["log", formatLog],
]);
