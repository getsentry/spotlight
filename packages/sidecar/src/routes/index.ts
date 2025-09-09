import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { CONTEXT_LINES_ENDPOINT } from "~/constants.js";
import { generateUuidv4 } from "~/messageBuffer.js";
import clearRouter from "./clear.js";
import contextLinesRouter from "./contextlines/index.js";
import healthRouter from "./health.js";
import mcpRouter from "./mcp/index.js";
import openRouter from "./open.js";
import streamRouter from "./stream/index.js";

const CONTEXT_ID = generateUuidv4();
const router = new Hono().use(contextStorage(), async (ctx, next) => {
  ctx.set("contextId", CONTEXT_ID);

  await next();
});

router.route("/mcp", mcpRouter);
router.route("/health", healthRouter);
router.route("/clear", clearRouter);
router.route("/", streamRouter);
router.route("/open", openRouter);
router.route(CONTEXT_LINES_ENDPOINT, contextLinesRouter);

export default router;
