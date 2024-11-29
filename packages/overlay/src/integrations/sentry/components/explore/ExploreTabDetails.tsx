import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import sentryDataCache from '../../data/sentryDataCache';
import DeveloperInfoTab from '../../tabs/DeveloperInfo';
import SdksTab from '../../tabs/SdksTab';
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
    {
      id: 'sdks',
      title: 'SDKs',
      active: activeTab === 'sdks',
      onSelect: () => setActiveTab('sdks'),
    },
    {
      id: 'devInfo',
      title: 'Developer Info',
      active: activeTab === 'devInfo',
      onSelect: () => setActiveTab('devInfo'),
    },
  ];

  return (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex-1">
        <Routes>
          <Route path="/devInfo/*" element={<DeveloperInfoTab />} />
          <Route path="/sdks/*" element={<SdksTab />} />
          <Route path="/traces/*" element={<TracesTab />} />
          <Route path="*" element={<Navigate to="/explore/traces" replace />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
