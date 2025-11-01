import Logs from "../components/log";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";

import { Route, Routes } from "react-router-dom";

export default function LogsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/*" element={<Logs />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
