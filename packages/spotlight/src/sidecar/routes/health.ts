import { Hono } from "hono";

const router = new Hono();

router.get("/", ctx => ctx.text("OK"));

export default router;
