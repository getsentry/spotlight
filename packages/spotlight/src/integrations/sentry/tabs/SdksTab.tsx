import { Route, Routes } from 'react-router-dom';
import SdkList from '../components/SdkList';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function SdksTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<SdkList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
