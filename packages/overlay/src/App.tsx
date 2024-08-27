import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Debugger from './components/Debugger';
import Trigger from './components/Trigger';
import type { Integration, IntegrationData } from './integrations/integration';
import { getSpotlightEventTarget } from './lib/eventTarget';
import { log } from './lib/logger';
import useKeyPress from './lib/useKeyPress';
import { connectToSidecar } from './sidecar';
import type { NotificationCount, SpotlightOverlayOptions } from './types';

type AppProps = Omit<SpotlightOverlayOptions, 'debug' | 'injectImmediately'> &
  Required<Pick<SpotlightOverlayOptions, 'sidecarUrl'>>;

export default function App({
  openOnInit = false,
  showTriggerButton = true,
  integrations = [],
  sidecarUrl,
  anchor,
  fullPage = false,
  showClearEventsButton = true,
}: AppProps) {
  const [integrationData, setIntegrationData] = useState<IntegrationData<unknown>>({});
  const [isOnline, setOnline] = useState(false);
  const [triggerButtonCount, setTriggerButtonCount] = useState<NotificationCount>({ count: 0, severe: false });
  const [isOpen, setOpen] = useState(openOnInit);
  log('App rerender', integrationData, isOnline, triggerButtonCount, isOpen);

  const contentTypeListeners = useMemo(() => {
    // Map that holds the information which kind of content type should be dispatched to which integration(s)
    const contentTypeToIntegrations = new Map<string, Integration[]>();
    for (const integration of integrations) {
      if (!integration.forwardedContentType) continue;

      for (const contentType of integration.forwardedContentType) {
        let integrationsForContentType = contentTypeToIntegrations.get(contentType);
        if (!integrationsForContentType) {
          integrationsForContentType = [];
          contentTypeToIntegrations.set(contentType, integrationsForContentType);
        }
        integrationsForContentType.push(integration);
      }
    }

    const result: Record<string, (event: { data: string | Buffer }) => void> = Object.create(null);
    for (const [contentType, integrations] of contentTypeToIntegrations.entries()) {
      const listener = (event: { data: string | Buffer }): void => {
        log(`Received new ${contentType} event`);
        for (const integration of integrations) {
          const newIntegrationData = integration.processEvent
            ? integration.processEvent({
                contentType,
                data: event.data,
              })
            : { event };

          if (!newIntegrationData) {
            continue;
          }

          const integrationName = integration.name;
          setIntegrationData(prev => ({
            ...prev,
            [integrationName]: [...(prev[integrationName] || []), newIntegrationData],
          }));
        }
      };

      log('Adding listener for', contentType);

      // `contentType` could for example be "application/x-sentry-envelope"
      result[contentType] = listener;
    }
    return result;
  }, [integrations]);

  useEffect(
    () => connectToSidecar(sidecarUrl, contentTypeListeners, setOnline) as () => undefined,
    [sidecarUrl, contentTypeListeners],
  );

  const spotlightEventTarget = useMemo(() => getSpotlightEventTarget(), []);

  // Note that `useNavigate()` relies on `useLocation()` which
  // causes a full re-render here every time we change the location
  // We can fix this by doing `const router = createMemoryRouter()`
  // and using `router.navigate()` but that requires a larger refactor
  // as our <Route>s are scattered around a bit
  // See https://github.com/remix-run/react-router/issues/7634
  const navigate = useNavigate();
  const eventHandlers = useMemo(() => {
    log('useMemo: initializing event handlers');
    const clearEvents = async () => {
      const { origin } = new URL(sidecarUrl);
      const clearEventsUrl: string = `${origin}/clear`;

      try {
        await fetch(clearEventsUrl, {
          method: 'DELETE',
          mode: 'cors',
        });
      } catch (err) {
        console.error(
          `Spotlight can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/`,
          err,
        );
        return;
      }

      for (const integration of integrations) {
        setIntegrationData(prev => ({ ...prev, [integration.name]: [] }));
        if (integration.reset) integration.reset();
      }
    };

    const onOpen = (
      e: CustomEvent<{
        path: string | undefined;
      }>,
    ) => {
      log('Open');
      setOpen(true);
      if (e.detail.path) navigate(e.detail.path);
    };

    const onClose = () => {
      log('Close');
      setOpen(false);
    };

    const onToggle = () => {
      log('Toggle');
      setOpen(prev => !prev);
    };

    const onNavigate = (e: CustomEvent<string>) => {
      log('Navigate');
      navigate(e.detail);
    };

    const onEvent = ({ detail }: CustomEvent<{ contentType: string; data: string }>) => {
      const { contentType, data } = detail;
      const listener = contentTypeListeners[contentType];
      if (!listener) {
        log('Got event for unknown content type:', contentType);
        return;
      }
      listener({ data });
    };

    return { clearEvents, onEvent, onOpen, onClose, onNavigate, onToggle };
  }, [integrations, navigate, sidecarUrl, contentTypeListeners]);

  useKeyPress(['ctrlKey', 'F12'], eventHandlers.onToggle);

  useEffect(() => {
    log('useEffect: Adding event listeners');
    spotlightEventTarget.addEventListener('open', eventHandlers.onOpen as EventListener);
    spotlightEventTarget.addEventListener('close', eventHandlers.onClose);
    spotlightEventTarget.addEventListener('navigate', eventHandlers.onNavigate as EventListener);
    spotlightEventTarget.addEventListener('clearEvents', eventHandlers.clearEvents as EventListener);
    spotlightEventTarget.addEventListener('event', eventHandlers.onEvent as EventListener);

    return (): undefined => {
      log('useEffect[destructor]: Removing event listeners');
      spotlightEventTarget.removeEventListener('open', eventHandlers.onOpen as EventListener);
      spotlightEventTarget.removeEventListener('close', eventHandlers.onClose);
      spotlightEventTarget.removeEventListener('navigate', eventHandlers.onNavigate as EventListener);
      spotlightEventTarget.removeEventListener('clearEvents', eventHandlers.clearEvents as EventListener);
      spotlightEventTarget.removeEventListener('event', eventHandlers.onEvent as EventListener);
    };
  }, [spotlightEventTarget, eventHandlers]);

  useEffect(() => {
    if (!isOpen) {
      spotlightEventTarget.dispatchEvent(new CustomEvent('closed'));
      document.body.style.overflow = 'auto';
    } else {
      spotlightEventTarget.dispatchEvent(new CustomEvent('opened'));
      document.body.style.overflow = 'hidden';
    }
  }, [isOpen, spotlightEventTarget]);

  useEffect(() => {
    if (triggerButtonCount.severe) {
      spotlightEventTarget.dispatchEvent(
        new CustomEvent('severeEventCount', { detail: { count: triggerButtonCount.count } }),
      );
    }
  }, [triggerButtonCount, spotlightEventTarget]);

  return (
    <>
      {showTriggerButton && (
        <Trigger isOpen={isOpen} setOpen={setOpen} notificationCount={triggerButtonCount} anchor={anchor} />
      )}
      <Debugger
        isOpen={fullPage || isOpen}
        setOpen={setOpen}
        isOnline={isOnline}
        integrations={integrations}
        integrationData={integrationData}
        setTriggerButtonCount={setTriggerButtonCount}
        fullPage={fullPage}
        showClearEventsButton={showClearEventsButton}
      />
    </>
  );
}
