import { describe, expect, it } from "vitest";
import { app } from "../main.js";

describe("generic endpoints", () => {
  it("should return 200 on health check", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });

  it("should return 404 on unknown endpoint", async () => {
    const response = await app.request("/unknown");
    expect(response.status).toBe(404);
  });

  it("should return method not allowed on unknown method", async () => {
    const response = await app.request("/health", { method: "POST" });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("404 Not Found");
  });
});
