import PerformanceTabDetails from '../components/performance';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

import { Route, Routes } from 'react-router-dom';

export default function PerformanceTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/*" element={<PerformanceTabDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
