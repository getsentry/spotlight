import { useState } from "react";
import Trigger from "./components/Trigger";
import Debugger from "./components/Debugger";
import { SentryEventsContextProvider } from "./lib/sentryEventsContext";
import { NavigationProvider } from "./lib/navigationContext";
import { OnlineContextProvider } from "./lib/onlineContext";
import type { Integration } from "./integrations/integration";

export default function App({
  fullScreen = false,
  defaultEventId,
  integrations = [],
}: {
  fullScreen?: boolean;
  defaultEventId?: string;
  integrations?: Integration[];
}) {
  const [isOpen, setOpen] = useState(fullScreen);

  return (
    <>
      <SentryEventsContextProvider>
        <OnlineContextProvider>
          <NavigationProvider initializedIntegrations={integrations}>
            <Trigger isOpen={isOpen} setOpen={setOpen} />
            <Debugger
              isOpen={isOpen}
              setOpen={setOpen}
              defaultEventId={defaultEventId}
            />
          </NavigationProvider>
        </OnlineContextProvider>
      </SentryEventsContextProvider>
    </>
  );
}
