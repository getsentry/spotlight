import { Hono } from "hono";
import { getBuffer } from "../utils/index.ts";

const router = new Hono();

router.delete("/", ctx => {
  getBuffer().clear();
  return ctx.text("Cleared");
});

export default router;
