import { readFileSync } from "node:fs";
import { Hono } from "hono";
import {
  addContextLinesToFrame,
  applySourceContextToFrame,
  getGeneratedCodeFromServer,
  isValidSentryStackFrame,
  parseStackTrace,
} from "./utils.js";

const router = new Hono();

router.put("/", async ctx => {
  const requestBody = await ctx.req.text();

  const stacktrace = parseStackTrace(requestBody);

  if (!stacktrace) {
    return ctx.body(null, 500);
  }

  for (const frame of stacktrace.frames ?? []) {
    if (
      !isValidSentryStackFrame(frame) ||
      // let's ignore dependencies for now with this naive check
      frame.filename.includes("/node_modules/")
    ) {
      continue;
    }
    const { filename } = frame;
    // Dirty check to see if this looks like a regular file path or a URL
    if (filename.includes("://")) {
      const generatedCode = await getGeneratedCodeFromServer(frame.filename);
      if (!generatedCode) {
        continue;
      }

      // Extract the inline source map from the minified code
      const inlineSourceMapMatch = generatedCode.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.*)/);

      if (inlineSourceMapMatch?.[1]) {
        const sourceMapBase64 = inlineSourceMapMatch[1];
        const sourceMapContent = Buffer.from(sourceMapBase64, "base64").toString("utf-8");
        applySourceContextToFrame(sourceMapContent, frame);
      }
    } else if (!filename.includes(":")) {
      try {
        const lines = readFileSync(filename, { encoding: "utf-8" }).split(/\r?\n/);
        addContextLinesToFrame(lines, frame);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          throw err;
        }
      }
    }
  }

  return ctx.json(stacktrace);
});

export default router;
