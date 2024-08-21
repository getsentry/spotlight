import { ReactComponent as DeleteIcon } from '~/assets/deleteIcon.svg';
import { ReactComponent as Logo } from '~/assets/glyph.svg';
import type { Integration, IntegrationData } from '~/integrations/integration';
import { getSpotlightEventTarget } from '~/lib/eventTarget';
import type { NotificationCount } from '~/types';
import classNames from '../lib/classNames';
import Overview from './Overview';

function FullscreenBlur({
  isOpen,
  setOpen,
  fullPage,
  children,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  fullPage: boolean;
  children: React.ReactNode;
}) {
  if (fullPage) {
    return <>{children}</>;
  }
  return (
    <div
      className={classNames('spotlight-fullscreen-blur', isOpen ? '' : '!hidden')}
      onClick={e => {
        if (e.target === e.currentTarget) {
          setOpen(false);
        }
      }}
    >
      {children}
    </div>
  );
}

export default function Debugger({
  integrations,
  isOpen,
  setOpen,
  integrationData,
  isOnline,
  setTriggerButtonCount: setNotificationCount,
  fullPage,
  showClearEventsButton,
  skipSidecar,
}: {
  integrations: Integration[];
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  integrationData: IntegrationData<unknown>;
  isOnline: boolean;
  setTriggerButtonCount: (count: NotificationCount) => void;
  fullPage: boolean;
  showClearEventsButton: boolean;
  skipSidecar: boolean;
}) {
  return (
    <FullscreenBlur isOpen={isOpen} setOpen={setOpen} fullPage={fullPage}>
      <div className={classNames('spotlight-debugger', fullPage ? 'spotlight-fullscreen' : '')}>
        <div className="text-primary-200 flex items-center gap-x-2 px-6 py-4">
          <h1 className="font-raleway flex flex-1 items-end gap-x-1 leading-7 opacity-80">
            <div className="inline-flex items-center gap-x-4">
              <Logo height={32} width={32} />
              <div className="text-3xl font-light uppercase leading-7 tracking-widest">Spotlight</div>
            </div>
            <div className="text-primary-300 flex items-center gap-x-1 text-sm">
              <span>by</span>
              <a rel="noopener" href="https://sentry.io" target="_blank" className="font-semibold hover:underline">
                Sentry
              </a>
              <a href="https://github.com/getsentry/spotlight" target="_blank" rel="noopener" className="sl-flex ml-2">
                <span className="sr-only">GitHub</span>
                <svg
                  aria-hidden="true"
                  className="astro-6byselsc"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.08 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3Z"></path>
                </svg>
              </a>
              {!skipSidecar && (
                <div
                  className={classNames('ml-2 flex items-center gap-x-2 pl-2 text-xs', isOnline ? '' : 'text-red-400')}
                >
                  <div
                    className={classNames(
                      ' block h-2 w-2 rounded-full',
                      isOnline ? 'bg-green-400' : 'animate-pulse bg-red-400',
                    )}
                  />
                  {isOnline ? 'Connected to Sidecar' : 'Not connected to Sidecar'}
                </div>
              )}
            </div>
          </h1>
          {showClearEventsButton && (
            <button
              className="bg-primary-900 text-primary-300 hover:bg-primary-800 mr-1 flex items-center gap-1 rounded-md px-2 py-1 hover:transition-colors"
              onClick={() => {
                getSpotlightEventTarget().dispatchEvent(
                  new CustomEvent('clearEvents', {
                    detail: {},
                  }),
                );
              }}
            >
              <DeleteIcon width={18} height={18} className="fill-red-400 stroke-red-400" />
              <span className="leading-8">Clear Events</span>
            </button>
          )}
          {!fullPage && (
            <button
              className="hover:bg-primary-800 -my-1 -mr-3 cursor-pointer rounded px-3 py-1 font-mono text-2xl"
              onClick={() => {
                setOpen(false);
              }}
            >
              {'✕'}
            </button>
          )}
        </div>
        <Overview
          integrations={integrations}
          integrationData={integrationData}
          setTriggerButtonCount={setNotificationCount}
          setOpen={setOpen}
        />
      </div>
    </FullscreenBlur>
  );
}
