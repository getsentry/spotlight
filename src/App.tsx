import { useState } from "react";
import Trigger from "./components/Trigger";
import Debugger from "./components/Debugger";
import { SentryEventsContextProvider } from "./lib/sentryEventsContext";
import { NavigationProvider } from "./lib/navigationContext";

export default function App({ fullScreen = false }: { fullScreen?: boolean }) {
  const [isOpen, setOpen] = useState(fullScreen);

  return (
    <>
      <SentryEventsContextProvider>
        <NavigationProvider>
          <Trigger isOpen={isOpen} setOpen={setOpen} />
          <Debugger isOpen={isOpen} setOpen={setOpen} />
        </NavigationProvider>
      </SentryEventsContextProvider>
    </>
  );
}
