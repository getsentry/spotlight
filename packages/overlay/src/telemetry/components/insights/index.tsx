import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Profiles from "./Profiles";
import Queries from "./Queries";
import QuerySummary from "./QuerySummary";
import Resources from "./Resources";
import AItracesTab from "./aiTraces";
import EnvelopesTab from "./envelopes";
import SdksTab from "./sdks";
import WebVitals from "./webVitals";
import WebVitalsDetail from "./webVitals/WebVitalsDetail";

export default function InsightsTabDetails() {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Routes>
          <Route path="queries" element={<Queries />} />
          <Route path="queries/:type" element={<QuerySummary />} />
          <Route path="resources" element={<Resources />} />
          <Route path="webvitals" element={<WebVitals />} />
          <Route path="webvitals/:page" element={<WebVitalsDetail />} />
          <Route path="envelopes/*" element={<EnvelopesTab />} />
          <Route path="sdks/*" element={<SdksTab />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="aitraces/*" element={<AItracesTab />} />
          {/* Default tab */}
          <Route path="*" element={<Navigate to="/insights/queries" replace />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
