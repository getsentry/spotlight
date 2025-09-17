import { Navigate, Route, Routes } from "react-router-dom";
// TODO: we'll lazy load this in case of multiple routes
import { Telemetry } from "./telemetry";

type AppProps = {
  sidecarUrl: string;
  showClearEventsButton?: boolean;
};

export default function App({ sidecarUrl, showClearEventsButton = true }: AppProps) {
  return (
    <Routes>
      {/* Default route redirects to telemetry */}
      <Route path="/" element={<Navigate to="/telemetry" replace />} />

      <Route
        path="/telemetry/*"
        element={<Telemetry sidecarUrl={sidecarUrl} showClearEventsButton={showClearEventsButton} />}
      />
    </Routes>
  );
}
