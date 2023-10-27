import { useEffect, useState } from "react";
import Trigger from "./components/Trigger";
import Debugger from "./components/Debugger";
import { SentryEventsContextProvider } from "./lib/sentryEventsContext";
import { NavigationProvider } from "./lib/navigationContext";
import { OnlineContextProvider } from "./lib/onlineContext";
import type { Integration } from "./integrations/integration";
import { connectToRelay } from ".";

const DEFAULT_RELAY = "http://localhost:8969/stream";

export default function App({
  fullScreen = false,
  defaultEventId,
  integrations = [],
}: {
  fullScreen?: boolean;
  defaultEventId?: string;
  integrations?: Integration[];
}) {
  console.log('[Spotlight] App rerender')

  const [integrationData, setIntegrationData] = useState<Record<string, Array<unknown>>>({})

  useEffect(() => {
    // Map that holds the information which kind of content type should be dispatched to which integration(s)
    const contentTypeToIntegrations = new Map<string, Integration[]>();

    integrations.forEach((integration) => 
      integration.forwardedContentType?.forEach((contentType) => {
        const i = contentTypeToIntegrations.get(contentType) || [];
        i.push(integration);
        contentTypeToIntegrations.set(contentType, i);
      })
    );

    const cleanupListeners = connectToRelay(DEFAULT_RELAY, contentTypeToIntegrations, setIntegrationData);

    return () => {
      console.log('[Spotlight] useeffect cleanup')
      cleanupListeners();
    }
  }, [] );

  const [isOpen, setOpen] = useState(fullScreen);

  console.log('[Spotlight] Integrations', integrationData);

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
              integrationData={integrationData}
            />
          </NavigationProvider>
        </OnlineContextProvider>
      </SentryEventsContextProvider>
    </>
  );
}
