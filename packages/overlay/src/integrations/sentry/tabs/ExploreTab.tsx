import { Route, Routes } from 'react-router-dom';
import ExploreTabDetails from '../components/explore/ExploreTabDetails';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function ExploreTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/*" element={<ExploreTabDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
