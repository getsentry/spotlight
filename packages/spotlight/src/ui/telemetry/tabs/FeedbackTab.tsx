import { Route, Routes } from "react-router-dom";
import FeedbackDetails from "../components/feedback/FeedbackDetails";
import FeedbackList from "../components/feedback/FeedbackList";
import { SentryEventsContextProvider } from "../data/sentryEventsContext";

export default function FeedbackTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<FeedbackList />} />
        <Route path="/:eventId/*" element={<FeedbackDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
