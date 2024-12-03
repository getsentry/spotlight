import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import sentryDataCache from '../../data/sentryDataCache';
import EnvelopesTab from './envelopes';
import SdksTab from './sdks';
import TracesTab from './traces';

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
      id: 'envelopes',
      title: 'Envelopes',
      active: activeTab === 'envelopes',
      onSelect: () => setActiveTab('envelopes'),
    },
  ];

  return (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex-1">
        <Routes>
          <Route path="/envelopes/*" element={<EnvelopesTab />} />
          <Route path="/sdks/*" element={<SdksTab />} />
          <Route path="/traces/*" element={<TracesTab />} />
          <Route path="*" element={<Navigate to="/explore/traces" replace />} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
