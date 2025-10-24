import type { Formatter } from "../types.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

const formatter = {
  formatError,
  formatLog,
  formatTrace,
} satisfies Formatter;

export default formatter;
