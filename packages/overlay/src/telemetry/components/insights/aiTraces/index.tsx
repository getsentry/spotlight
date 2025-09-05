import { Route, Routes } from "react-router-dom";
import { SentryEventsContextProvider } from "~/telemetry/data/sentryEventsContext";
import AITraceList from "./AITraceList";

export default function AItracesTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<AITraceList />} />
        <Route path="/:spanId" element={<AITraceList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
