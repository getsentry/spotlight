import { useState } from "react";
import Trigger from "./components/Trigger";
import Debugger from "./components/Debugger";
import { SentryContextProvider } from "./lib/sentryContextProvider";

export default function App() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <SentryContextProvider>
        <Trigger isOpen={isOpen} setOpen={setOpen} />
        <Debugger isOpen={isOpen} setOpen={setOpen} />
      </SentryContextProvider>
    </>
  );
}
