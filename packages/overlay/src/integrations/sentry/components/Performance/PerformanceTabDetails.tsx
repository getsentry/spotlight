import { useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import { useSentrySpans } from '../../data/useSentrySpans';
import HiddenItemsButton from '../HiddenItemsButton';
import Queries from './Queries';
import QueryTraces from './QueryTraces';

export default function PerformanceTabDetails() {
  const context = useSpotlightContext();
  const [allSpans, localSpans] = useSentrySpans();

  const [activeTab, setActiveTab] = useState('');
  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);

  const hiddenItemCount = allSpans.length - localSpans.length;

  const tabs = [
    {
      id: '', // To set the tab as default and to navigate back properly
      title: 'Queries',
      active: activeTab === '',
      onSelect: () => setActiveTab(''),
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
          <Route path="queries/:type" element={<QueryTraces showAll={showAll} />} />
          {/* Default tab */}
          <Route path="*" element={<Queries showAll={showAll} />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
