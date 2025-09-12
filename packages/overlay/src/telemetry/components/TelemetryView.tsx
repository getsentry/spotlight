import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { log } from "~/lib/logger";
import { getRouteStorageKey } from "~/lib/routePersistence";
import useSentryStore from "../store";
import ErrorsTab from "../tabs/ErrorsTab";
import InsightsTab from "../tabs/InsightsTab";
import LogsTab from "../tabs/LogsTab";
import TracesTab from "../tabs/TracesTab";
import { isErrorEvent } from "../utils/sentry";
import TelemetrySidebar from "./TelemetrySidebar";

export default function TelemetryView({
  isOnline,
  showClearEventsButton,
  contextId,
}: {
  isOnline: boolean;
  showClearEventsButton: boolean;
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

  return (
    <div className="spotlight-debugger from-primary-900 to-primary-950 flex h-full overflow-hidden bg-gradient-to-br from-0% to-20% font-sans text-white">
      <TelemetrySidebar
        errorCount={errorCount}
        traceCount={traceCount}
        isOnline={isOnline}
        showClearEventsButton={showClearEventsButton}
      />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/not-found" element={<p>Not Found - How'd you manage to get here?</p>} key="not-found" />
          <Route path="/traces/*" element={<TracesTab />} key="traces" />
          <Route path="/errors/*" element={<ErrorsTab />} key="errors" />
          <Route path="/logs/*" element={<LogsTab />} key="logs" />
          <Route path="/insights/*" element={<InsightsTab />} key="insights" />
          <Route path="/" element={<TracesTab />} key="default" />
        </Routes>
      </div>
    </div>
  );
}
