import { Navigate, Route, Routes } from "react-router-dom";
import { ShikiProvider } from "./ShikiProvider";
// TODO: we'll lazy load this in case of multiple routes
import { Telemetry } from "./telemetry";
import { ControlCenter } from "./control-center/ControlCenter";

type AppProps = {
  sidecarUrl: string;
};

export default function App({ sidecarUrl }: AppProps) {
  return (
    <ShikiProvider>
      <Routes>
        {/* Default route redirects to telemetry */}
        <Route path="/" element={<Navigate to="/telemetry" replace />} />

        <Route path="/telemetry/*" element={<Telemetry sidecarUrl={sidecarUrl} />} />
        
        <Route path="/control-center" element={<ControlCenter sidecarUrl={sidecarUrl} />} />
      </Routes>
    </ShikiProvider>
  );
}
