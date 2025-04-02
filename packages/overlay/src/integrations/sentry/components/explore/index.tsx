import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import { createTab } from '../../utils/tabs';
import EnvelopesTab from './envelopes';
import SdksTab from './sdks';
import TracesTab from './traces';

export default function ExploreTabDetails() {
  const tabs = [createTab('traces', 'Traces'), createTab('sdks', 'SDKs'), createTab('envelopes', 'Envelopes')];

  return (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex min-h-0 flex-1 flex-col">
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
