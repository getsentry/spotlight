import SdkList from '../components/SdkList';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function SdksTab() {
  return (
    <SentryEventsContextProvider>
      <SdkList />
    </SentryEventsContextProvider>
  );
}
