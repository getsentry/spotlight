import { useState } from "react";
import Trigger from "./components/Trigger";
import Debugger from "./components/Debugger";
import { SentryContextProvider } from "./lib/useSentryEvents";
import { SentryEvent } from "./types";

export default function App({
  relay,
  initialEvents = [],
}: {
  relay?: string;
  initialEvents?: SentryEvent[];
}) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <SentryContextProvider initialValue={initialEvents} relay={relay}>
        <Trigger isOpen={isOpen} setOpen={setOpen} />
        <Debugger isOpen={isOpen} setOpen={setOpen} />
      </SentryContextProvider>
    </>
  );
}
