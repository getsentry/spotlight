import type { TabPanel } from "@spotlight/ui/types";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import TelemetryTabs from "./TelemetryTabs";

const tabs: TabPanel<unknown>[] = [
  { id: "context", title: "Context" },
  { id: "logs", title: "Logs" },
];

function renderTabsAt(initialPath: string) {
  // Mirrors the real app: TelemetryTabs is rendered inside a splat route, as a
  // sibling of the inner <Routes>. Under React Router v7 a relative link in this
  // position resolves against the full current location (including the splat),
  // so we pass an absolute basePath to keep tab targets stable.
  const { container } = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/telemetry/traces/:traceId/*"
          element={<TelemetryTabs tabs={tabs} basePath="/telemetry/traces/TID" nested />}
        />
      </Routes>
    </MemoryRouter>,
  );
  return [...container.querySelectorAll("a")].map(a => a.getAttribute("href"));
}

describe("TelemetryTabs (splat-route path stacking regression)", () => {
  it("resolves tab links to absolute paths, never stacking the splat segment", () => {
    expect(renderTabsAt("/telemetry/traces/TID/context")).toEqual([
      "/telemetry/traces/TID/context",
      "/telemetry/traces/TID/logs",
    ]);
  });

  it("keeps tab targets stable regardless of how deep the current URL is", () => {
    const fromContext = renderTabsAt("/telemetry/traces/TID/context");
    const fromLogsDetail = renderTabsAt("/telemetry/traces/TID/logs/123");
    // The links must point at the same place no matter the current location.
    expect(fromContext).toEqual(fromLogsDetail);
    // And must not contain a duplicated trailing segment (the old bug).
    for (const href of fromLogsDetail) {
      expect(href).not.toMatch(/\/(context|logs)\/(context|logs)(\/|$)/);
    }
  });
});
