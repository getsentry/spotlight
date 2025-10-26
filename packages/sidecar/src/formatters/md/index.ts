import type { Formatter, FormatterFunction } from "../types.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

const formatter = {
  formatError,
  formatLog,
  formatTrace,
  formatters: new Map<string, FormatterFunction>([
    ["event", formatError as FormatterFunction],
    ["transaction", formatTrace as FormatterFunction],
    ["log", formatLog as FormatterFunction],
  ]),
} satisfies Formatter;

export default formatter;
