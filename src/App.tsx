import { useState } from "react";
import Trigger from "./components/Trigger";
import Debugger from "./components/Debugger";
import { SentryEventsContextProvider } from "./lib/sentryEventsContext";
import { NavigationProvider } from "./lib/navigationContext";
import { OnlineContextProvider } from "./lib/onlineContext";

export default function App({
  fullScreen = false,
  defaultEventId,
}: {
  fullScreen?: boolean;
  defaultEventId?: string;
}) {
  const [isOpen, setOpen] = useState(fullScreen);

  return (
    <>
      <SentryEventsContextProvider>
        <OnlineContextProvider>
          <NavigationProvider>
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
