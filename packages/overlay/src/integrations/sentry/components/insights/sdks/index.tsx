import { Route, Routes } from "react-router-dom";
import { SentryEventsContextProvider } from "../../../data/sentryEventsContext";
import SdkList from "./SdkList";

export default function SdksTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<SdkList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
