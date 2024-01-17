import { useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import Tabs from '../../../../components/Tabs';
import { useSentrySpans } from '../../data/useSentrySpans';
import HiddenItemsButton from '../HiddenItemsButton';
import Queries from './Queries';
import QueryTraces from './QueryTraces';
import Resources from './Resources';
import { WebVitals } from './WebVitals';

export default function PerformanceTabDetails() {
  const context = useSpotlightContext();
  const [allSpans, localSpans] = useSentrySpans();

  const [activeTab, setActiveTab] = useState('queries');
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
      id: 'resources',
      title: 'Resources',
      active: activeTab === 'resources',
      onSelect: () => setActiveTab('resources'),
    },
    {
      id: 'webVitals',
      title: 'Web Vitals',
      active: activeTab === 'webVitals',
      onSelect: () => setActiveTab('webVitals'),
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
      <div className="flex-1 px-6 py-4">
        <Routes>
          <Route path="resources" element={<Resources />} />
          <Route path="webVitals" element={<WebVitals />} />
          <Route path="queries/:type" element={<QueryTraces showAll={showAll} />} />
          {/* Default tab */}
          <Route path="*" element={<Queries showAll={showAll} />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
