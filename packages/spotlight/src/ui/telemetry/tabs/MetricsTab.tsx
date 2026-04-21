import { Route, Routes } from "react-router-dom";
import MetricsList from "../components/metrics/MetricsList";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";

export default function MetricsTab() {
  return (
    <SentryEventsContextProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<MetricsList />} />
            <Route path="/:metricId/*" element={<MetricsList />} />
          </Routes>
        </div>
      </div>
    </SentryEventsContextProvider>
  );
}
