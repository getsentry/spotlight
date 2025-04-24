import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import { useSentrySpanCounts } from '../../data/useSentrySpans';
import { createTab } from '../../utils/tabs';
import HiddenItemsButton from '../shared/HiddenItemsButton';
import EnvelopesTab from './envelopes';
import FunctionProfiles from './FunctionProfiles';
import Queries from './Queries';
import QuerySummary from './QuerySummary';
import Resources from './Resources';
import SdksTab from './sdks';
import WebVitals from './webVitals';
import WebVitalsDetail from './webVitals/WebVitalsDetail';

export default function InsightsTabDetails() {
  const context = useSpotlightContext();
  const { allSpans, localSpans } = useSentrySpanCounts();

  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);

  const hiddenItemCount = allSpans - localSpans;

  const tabs = [
    createTab('queries', 'Queries'),
    createTab('webvitals', 'Web Vitals'),
    createTab('resources', 'Resources'),
    createTab('functionprofiles', 'Profiles'),
    createTab('envelopes', 'Envelopes'),
    createTab('sdks', 'SDKs'),
  ];

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
      <Tabs tabs={tabs} nested />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="queries/:type" element={<QuerySummary showAll={showAll} />} />
          <Route path="resources" element={<Resources showAll={showAll} />} />
          <Route path="webvitals" element={<WebVitals />} />
          <Route path="webvitals/:page" element={<WebVitalsDetail />} />
          <Route path="functionprofiles" element={<FunctionProfiles />} />
          <Route path="envelopes/*" element={<EnvelopesTab />} />
          <Route path="sdks/*" element={<SdksTab />} />
          {/* Default tab */}
          <Route path="queries" element={<Queries showAll={showAll} />} />
          <Route path="*" element={<Navigate to="/insights/queries" replace />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
