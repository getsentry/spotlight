import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import sentryDataCache from '../../data/sentryDataCache';
import TracesTab from '../../tabs/TracesTab';

export default function ExploreTabDetails() {
  const [activeTab, setActiveTab] = useState('');

  const localTraces = sentryDataCache.getTraces().filter(t => sentryDataCache.isTraceLocal(t.trace_id) !== false);

  const tabs = [
    {
      id: 'traces',
      title: 'Traces',
      active: activeTab === 'traces',
      onSelect: () => setActiveTab('traces'),
      notificationCount: {
        count: localTraces.length,
      },
    },
  ];

  return (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex-1">
        <Routes>
          <Route path="/traces/*" element={<TracesTab />} />
          <Route path="*" element={<Navigate to="/explore/traces" replace />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
