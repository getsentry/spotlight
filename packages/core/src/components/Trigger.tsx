export default function Trigger({ isOpen, setOpen }: { isOpen: boolean; setOpen: (value: boolean) => void }) {
  // TODO: replace w/ generic counter
  // const events = []; useSentryEvents();
  // const traces = []; useSentryTraces();

  const errorCount = 0; // events.filter(e => 'exception' in e).length;
  const traceCount = 0; //traces.length;

  return (
    <div
      className="sentry-trigger"
      style={{
        display: isOpen ? 'none' : undefined,
      }}
      onClick={() => setOpen(!isOpen)}
    >
      Spotlight
      <span className={errorCount === 0 ? 'bg-indigo-300 text-indigo-600' : 'bg-red-500 text-white'}>
        {errorCount + traceCount}
      </span>
    </div>
  );
}
