import TraceDetails from "../components/traces/TraceDetails";
import TraceList from "../components/traces/TraceList";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";

import { Route, Routes } from "react-router-dom";

export default function TracesTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/:traceId/*" element={<TraceDetails />} />
        <Route path="/" element={<TraceList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
