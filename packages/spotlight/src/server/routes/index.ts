import { Hono } from "hono";
import { CONTEXT_LINES_ENDPOINT } from "../constants.ts";
import clearRouter from "./clear.ts";
import contextLinesRouter from "./contextlines/index.ts";
import healthRouter from "./health.ts";
import mcpRouter from "./mcp.ts";
import openRouter from "./open.ts";
import streamRouter from "./stream/index.ts";

const router = new Hono();
router.route("/mcp", mcpRouter);
router.route("/health", healthRouter);
router.route("/clear", clearRouter);
router.route("/", streamRouter);
router.route("/open", openRouter);
router.route(CONTEXT_LINES_ENDPOINT, contextLinesRouter);

export default router;
