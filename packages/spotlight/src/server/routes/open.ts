import { resolve } from "node:path";
import { Hono } from "hono";
import launchEditor from "launch-editor";
import { logger } from "../logger.ts";
import type { HonoEnv } from "../types/index.ts";

const router = new Hono<HonoEnv>();

// ASK: Will this still be used in a desktop app? And if so, do we still have a base path and cwd?
router.post("/", async ctx => {
  const basePath = ctx.get("basePath") ?? process.cwd();

  const requestBody = await ctx.req.text();
  const targetPath = resolve(basePath, requestBody);
  logger.debug(`Launching editor for ${targetPath}`);
  launchEditor(
    // filename:line:column
    // both line and column are optional
    targetPath,
    // callback if failed to launch (optional)
    (fileName, errorMsg) => {
      logger.error(`Failed to launch editor for ${fileName}: ${errorMsg}`);
    },
  );
  return ctx.body(null, 204);
});

export default router;
