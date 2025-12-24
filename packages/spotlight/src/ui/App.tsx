import { ErrorBoundary } from "@sentry/react";
import { ReactComponent as Logo } from "@spotlight/ui/assets/glyph.svg";
import { Navigate, Route, Routes } from "react-router-dom";
import { ShikiProvider } from "./ShikiProvider";
// TODO: we'll lazy load this in case of multiple routes
import { Telemetry } from "./telemetry";

type AppProps = {
  sidecarUrl: string;
};

export default function App({ sidecarUrl }: AppProps) {
  return (
    <div className="from-primary-900 to-primary-950 flex h-full overflow-hidden bg-gradient-to-br from-0% to-20% font-sans text-white">
      <ErrorBoundary fallback={<ErrorFallback />}>
        <ShikiProvider>
          <Routes>
            {/* Default route redirects to telemetry */}
            <Route path="/" element={<Navigate to="/telemetry" replace />} />

            <Route path="/telemetry/*" element={<Telemetry sidecarUrl={sidecarUrl} />} />
          </Routes>
        </ShikiProvider>
      </ErrorBoundary>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="flex items-center gap-2 mb-4">
        <Logo height={24} width={24} />
        <p className="text-white text-2xl font-bold">Spotlight</p>
      </div>
      <h1 className="text-white text-4xl font-bold">Oops! An error occurred</h1>
      <p className="text-white text-xl">Press Cmd/Ctrl + R to reload the app</p>
    </div>
  );
}
