import { useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import { useSentrySpans } from '../../data/useSentrySpans';
import HiddenItemsButton from '../HiddenItemsButton';
import Queries from './Queries';
import QuerySummary from './QuerySummary';
import Resources from './Resources';
import WebVitals from './WebVitals';
import WebVitalsDetail from './WebVitals/WebVitalsDetail';

export default function PerformanceTabDetails() {
  const context = useSpotlightContext();
  const [allSpans, localSpans] = useSentrySpans();

  const [activeTab, setActiveTab] = useState('');
  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);

  const hiddenItemCount = allSpans.length - localSpans.length;

  const tabs = [
    {
      id: 'queries',
      title: 'Queries',
      active: activeTab === 'queries',
      onSelect: () => setActiveTab('queries'),
    },
    {
      id: 'webvitals',
      title: 'Web Vitals',
      active: activeTab === 'webvitals',
      onSelect: () => setActiveTab('webvitals'),
    },
    {
      id: 'resources',
      title: 'Resources',
      active: activeTab === 'resources',
      onSelect: () => setActiveTab('resources'),
    },
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
      <div className="flex-1">
        <Routes>
          <Route path="queries/:type" element={<QuerySummary showAll={showAll} />} />
          <Route path="resources" element={<Resources showAll={showAll} />} />
          <Route path="webvitals" element={<WebVitals showAll={showAll} />} />
          <Route path="webvitals/:page" element={<WebVitalsDetail />} />
          {/* Default tab */}
          <Route path="*" element={<Queries showAll={showAll} />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
