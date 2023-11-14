import { useEffect } from 'react';
import classNames from '~/lib/classNames';
import useKeyPress from '~/lib/useKeyPress';
import { useNavigation } from '~/lib/useNavigation';
import Overview from './Overview';

export default function Debugger({
  isOpen,
  setOpen,
  defaultEventId,
  integrationData,
  isOnline,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  defaultEventId?: string;
  integrationData: Record<string, Array<unknown>>;
  isOnline: boolean;
}) {
  useKeyPress('Escape', () => {
    setOpen(false);
  });

  // TODO: this needs to defer til events are received, and listen for those events
  const { setEventId } = useNavigation();
  useEffect(() => {
    if (defaultEventId) {
      setEventId(defaultEventId);
    }
  }, [defaultEventId, setEventId]);

  return (
    <div
      className="sentry-debugger"
      style={{
        display: isOpen ? undefined : 'none',
      }}
    >
      <div className="flex items-center gap-x-2 bg-indigo-950 px-6 py-4 text-indigo-200">
        <h1 className="font-raleway flex flex-1 items-end gap-x-1 opacity-80">
          <div className="text-3xl font-light uppercase tracking-widest">Spotlight</div>
          <div className="flex items-center gap-x-1 text-sm text-indigo-300">
            by{' '}
            <a href="https://sentry.io" className="font-semibold hover:underline">
              Sentry
            </a>
            <div className={classNames('ml-2 flex items-center gap-x-2 pl-2 text-xs', isOnline ? '' : 'text-red-400')}>
              <div
                className={classNames(
                  ' block h-2 w-2 rounded-full',
                  isOnline ? 'bg-green-400' : 'animate-pulse bg-red-400',
                )}
              />
              {isOnline ? 'Connected to Sidecar' : 'Not connected to Sidecar'}
            </div>
          </div>
        </h1>
        <button
          className="-my-1 -mr-3 cursor-pointer rounded bg-indigo-950 px-3 py-1 font-mono text-2xl hover:bg-black"
          onClick={() => {
            setOpen(false);
          }}
        >
          {'✕'}
        </button>
      </div>

      <Overview integrationData={integrationData} />
    </div>
  );
}
