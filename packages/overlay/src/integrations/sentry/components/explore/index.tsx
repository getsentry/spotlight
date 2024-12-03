import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import sentryDataCache from '../../data/sentryDataCache';
import { createTab } from '../../utils/tabs';
import EnvelopesTab from './envelopes';
import SdksTab from './sdks';
import TracesTab from './traces';

export default function ExploreTabDetails() {
  const localTraces = sentryDataCache.getTraces().filter(t => sentryDataCache.isTraceLocal(t.trace_id) !== false);

  const tabs = [
    createTab('traces', 'Traces', {
      notificationCount: {
        count: localTraces.length,
      },
    }),
    createTab('sdks', 'SDKs'),
    createTab('envelopes', 'Envelopes'),
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
