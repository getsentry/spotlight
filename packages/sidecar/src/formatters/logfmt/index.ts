import type { Formatter, FormatterFunction } from "../types.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

const formatter: Formatter = {
  formatters: new Map<string, FormatterFunction>([
    ["event", formatError as FormatterFunction],
    ["transaction", formatTrace as FormatterFunction],
    ["log", formatLog as FormatterFunction],
  ]),
};

export default formatter;
