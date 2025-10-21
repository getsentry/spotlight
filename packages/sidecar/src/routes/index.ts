import { Hono } from "hono";
import { CONTEXT_LINES_ENDPOINT } from "../constants.js";
import clearRouter from "./clear.js";
import contextLinesRouter from "./contextlines/index.js";
import healthRouter from "./health.js";
import mcpRouter from "./mcp.js";
import openRouter from "./open.js";
import streamRouter from "./stream/index.js";

const router = new Hono();
router.route("/mcp", mcpRouter);
router.route("/health", healthRouter);
router.route("/clear", clearRouter);
router.route("/", streamRouter);
router.route("/open", openRouter);
router.route(CONTEXT_LINES_ENDPOINT, contextLinesRouter);

export default router;
