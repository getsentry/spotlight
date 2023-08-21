import { useSentryEvents } from "../lib/useSentryEvents";

export default function Trigger({
  isOpen,
  setOpen,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
}) {
  const events = useSentryEvents();

  return (
    <div
      className="sentry-trigger"
      style={{
        display: isOpen ? "none" : undefined,
      }}
      onClick={() => setOpen(!isOpen)}
    >
      Sentry
      <span
        className={
          "bg-indigo-100 text-indigo-600 ml-3 hidden rounded py-0.5 px-1.5 text-xs font-medium md:inline-block"
        }
      >
        {events.length}
      </span>
    </div>
  );
}
