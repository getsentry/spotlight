import { log } from "@spotlight/ui/lib/logger";
import { getRouteStorageKey } from "@spotlight/ui/lib/routePersistence";
import { ElectronDragbarSpacer } from "@spotlight/ui/ui/electronDragbarSpacer";
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import useSentryStore from "../store";
import ErrorsTab from "../tabs/ErrorsTab";
import InsightsTab from "../tabs/InsightsTab";
import LogsTab from "../tabs/LogsTab";
import MetricsTab from "../tabs/MetricsTab";
import TracesTab from "../tabs/TracesTab";
import { isErrorEvent } from "../utils/sentry";
import TelemetrySidebar from "./TelemetrySidebar";

export default function TelemetryView({
  isOnline,
  contextId,
}: {
  isOnline: boolean;
  contextId: string;
}) {
  const location = useLocation();
  const store = useSentryStore();

  useEffect(() => {
    try {
      sessionStorage.setItem(getRouteStorageKey(contextId), location.pathname);
    } catch (error) {
      log("Failed to set current route to browser storage", {
        error,
        currentPath: location.pathname,
      });
    }
  }, [location.pathname, contextId]);

  // Calculate notification counts for Sentry tabs
  const errorCount = store.getEvents().reduce((sum, e) => sum + Number(isErrorEvent(e)), 0);
  const traceCount = store.getTraces().length;
  const logCount = store.getLogs().length;
  const metricCount = store.getMetrics().length;

  return (
    <>
      <TelemetrySidebar
        errorCount={errorCount}
        traceCount={traceCount}
        logCount={logCount}
        metricCount={metricCount}
        isOnline={isOnline}
      />
      <main className="flex flex-1 flex-col">
        <ElectronDragbarSpacer />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="not-found" element={<p>Not Found - How'd you manage to get here?</p>} key="not-found" />
            <Route path="traces/*" element={<TracesTab />} key="traces" />
            <Route path="errors/*" element={<ErrorsTab />} key="errors" />
            <Route path="logs/*" element={<LogsTab />} key="logs" />
            <Route path="metrics/*" element={<MetricsTab />} key="metrics" />
            <Route path="insights/*" element={<InsightsTab />} key="insights" />
            <Route path="" element={<TracesTab />} key="default" />
          </Routes>
        </div>
      </main>
    </>
  );
}
