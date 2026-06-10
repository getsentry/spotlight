import type { TabPanel } from "@spotlight/ui/types";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import TelemetryTabs from "./TelemetryTabs";

const tabs: TabPanel<unknown>[] = [
  { id: "context", title: "Context" },
  { id: "logs", title: "Logs" },
];

// Renders TelemetryTabs the way the app does: inside a splat route, as a sibling
// of the inner <Routes>. Returns the resolved hrefs of the rendered tab links.
function hrefsAt(initialPath: string, props: { basePath?: string; nested?: boolean }) {
  const { container } = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/telemetry/traces/:traceId/*" element={<TelemetryTabs tabs={tabs} {...props} />} />
      </Routes>
    </MemoryRouter>,
  );
  return [...container.querySelectorAll("a")].map(a => a.getAttribute("href"));
}

describe("TelemetryTabs (splat-route path stacking)", () => {
  it("with basePath, keeps tab links absolute and stable regardless of URL depth", () => {
    const want = ["/telemetry/traces/TID/context", "/telemetry/traces/TID/logs"];
    expect(hrefsAt("/telemetry/traces/TID/context", { basePath: "/telemetry/traces/TID" })).toEqual(want);
    // A deeper location (e.g. a logs detail) must resolve to the exact same targets.
    expect(hrefsAt("/telemetry/traces/TID/logs/123", { basePath: "/telemetry/traces/TID" })).toEqual(want);
  });

  it("demonstrates the bug basePath fixes: relative `nested` links stack the splat segment", () => {
    // Without basePath, the relative `./<id>` links resolve against the full
    // current location (including the splat) under React Router v7, producing a
    // stacked path. This is exactly the regression #1319 reported.
    expect(hrefsAt("/telemetry/traces/TID/context", { nested: true })).toEqual([
      "/telemetry/traces/TID/context/context",
      "/telemetry/traces/TID/context/logs",
    ]);
  });
});
