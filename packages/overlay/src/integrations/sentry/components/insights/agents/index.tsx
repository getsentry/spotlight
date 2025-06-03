import { Route, Routes } from "react-router-dom";
import { SentryEventsContextProvider } from "~/integrations/sentry/data/sentryEventsContext";
import AITraceList from "./AITraceList";

export default function AgentsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<AITraceList />} />
        <Route path="/:spanId" element={<AITraceList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
