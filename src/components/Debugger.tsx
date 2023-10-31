import useKeyPress from '~/lib/useKeyPress';
import Overview from './Overview';
import { useNavigation } from '~/lib/useNavigation';
import { useEffect } from 'react';
import { useOnlineStatus } from '~/lib/useOnlineStatus';
import classNames from '~/lib/classNames';

export default function Debugger({
  isOpen,
  setOpen,
  defaultEventId,
  integrationData,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  defaultEventId?: string;
  integrationData: Record<string, Array<unknown>>;
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

  const isOnline = useOnlineStatus();

  return (
    <div
      className="sentry-debugger"
      style={{
        display: isOpen ? undefined : 'none',
      }}
    >
      <div className="flex items-center text-indigo-200 bg-indigo-950 px-6 py-4 gap-x-2">
        <h1 className="flex-1 flex items-end gap-x-1 font-raleway opacity-80">
          <div className="uppercase font-light tracking-widest text-3xl">Spotlight</div>
          <div className="flex gap-x-1 text-sm items-center text-indigo-300">
            by{' '}
            <a href="https://sentry.io" className="hover:underline font-semibold">
              Sentry
            </a>
            <div className={classNames('pl-2 ml-2 flex items-center gap-x-2 text-xs', isOnline ? '' : 'text-red-400')}>
              <div
                className={classNames(
                  ' rounded-full w-2 h-2 block',
                  isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse',
                )}
              />
              {isOnline ? 'Connected to Sidecar' : 'Not connected to Sidecar'}
            </div>
          </div>
        </h1>
        <button
          className="cursor-pointer px-3 py-1 -my-1 text-2xl -mr-3 rounded bg-indigo-950 hover:bg-black font-mono"
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
