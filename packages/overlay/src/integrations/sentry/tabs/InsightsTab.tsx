import InsightsTabDetails from '../components/insights/InsightsTabDetails';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

import { Route, Routes } from 'react-router-dom';

export default function InsightsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/*" element={<InsightsTabDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
