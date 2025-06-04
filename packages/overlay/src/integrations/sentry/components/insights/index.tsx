import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useSpotlightContext } from "~/lib/useSpotlightContext";
import { useSentrySpanCounts } from "../../data/useSentrySpans";
import HiddenItemsButton from "../shared/HiddenItemsButton";
import Profiles from "./Profiles";
import Queries from "./Queries";
import QuerySummary from "./QuerySummary";
import Resources from "./Resources";
import AgentsTab from "./agents";
import EnvelopesTab from "./envelopes";
import SdksTab from "./sdks";
import WebVitals from "./webVitals";
import WebVitalsDetail from "./webVitals/WebVitalsDetail";

export default function InsightsTabDetails() {
  const context = useSpotlightContext();
  const { allSpans, localSpans } = useSentrySpanCounts();

  const [showAll, setShowAll] = useState(!context.experiments["sentry:focus-local-events"]);

  const hiddenItemCount = allSpans - localSpans;

  return (
    <>
      {!showAll && hiddenItemCount > 0 && (
        <HiddenItemsButton
          itemCount={hiddenItemCount}
          onClick={() => {
            setShowAll(true);
          }}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="queries" element={<Queries showAll={showAll} />} />
          <Route path="queries/:type" element={<QuerySummary showAll={showAll} />} />
          <Route path="resources" element={<Resources showAll={showAll} />} />
          <Route path="webvitals" element={<WebVitals />} />
          <Route path="webvitals/:page" element={<WebVitalsDetail />} />
          <Route path="envelopes/*" element={<EnvelopesTab showAll={showAll} />} />
          <Route path="sdks/*" element={<SdksTab />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="agents/*" element={<AgentsTab />} />
          {/* Default tab */}
          <Route path="*" element={<Navigate to="/insights/queries" replace />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
