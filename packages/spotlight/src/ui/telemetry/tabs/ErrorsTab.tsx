import EventDetails from "../components/events/EventDetails";
import EventList from "../components/events/EventList";

import { SentryEventsContextProvider } from "../data/sentryEventsContext";

import { Route, Routes } from "react-router-dom";

export default function ErrorsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/:eventId/*" element={<EventDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
