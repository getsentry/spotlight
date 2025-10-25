import type { Formatter } from "../types.js";
import { formatEnvelope } from "./envelope.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

const formatter = {
  formatError,
  formatLog,
  formatTrace,
  formatEnvelope,
} satisfies Formatter;

export default formatter;
