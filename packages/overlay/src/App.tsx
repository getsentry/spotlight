import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Debugger from './components/Debugger';
import Trigger from './components/Trigger';
import type { Integration, IntegrationData } from './integrations/integration';
import sentryDataCache from './integrations/sentry/data/sentryDataCache';
import { SentryEventsContext } from './integrations/sentry/data/sentryEventsContext';
import { getNativeFetchImplementation } from './integrations/sentry/sentry-integration';
import { getSpotlightEventTarget } from './lib/eventTarget';
import { log } from './lib/logger';
import useKeyPress from './lib/useKeyPress';
import { connectToSidecar } from './sidecar';
import { NotificationCount, SpotlightOverlayOptions } from './types';

type AppProps = Omit<SpotlightOverlayOptions, 'debug' | 'injectImmediately'> &
  Required<Pick<SpotlightOverlayOptions, 'sidecarUrl'>>;

export default function App({
  openOnInit = false,
  showTriggerButton = true,
  integrations = [],
  sidecarUrl,
  anchor,
  fullPage = false,
}: AppProps) {
  log('App rerender');
  const { setEvents } = useContext(SentryEventsContext);
  const [integrationData, setIntegrationData] = useState<IntegrationData<unknown>>({});
  const [isOnline, setOnline] = useState(false);
  const [triggerButtonCount, setTriggerButtonCount] = useState<NotificationCount>({ count: 0, severe: false });
  const [isOpen, setOpen] = useState(openOnInit);
  const [reloadSpotlight, setReloadSpotlight] = useState<number>(0);

  useKeyPress(['ctrlKey', 'F12'], () => {
    setOpen(prev => !prev);
  });

  useEffect(() => {
    // Map that holds the information which kind of content type should be dispatched to which integration(s)
    const contentTypeToIntegrations = new Map<string, Integration[]>();

    integrations.forEach(
      integration =>
        integration.forwardedContentType?.forEach(contentType => {
          const i = contentTypeToIntegrations.get(contentType) || [];
          i.push(integration);
          contentTypeToIntegrations.set(contentType, i);
        }),
    );

    const cleanupListeners = connectToSidecar(sidecarUrl, contentTypeToIntegrations, setIntegrationData, setOnline);

    return () => {
      log('useEffect cleanup');
      cleanupListeners();
    };
  }, [integrations, sidecarUrl, reloadSpotlight]);

  const spotlightEventTarget = getSpotlightEventTarget();

  const navigate = useNavigate();

  const clearEvents = () => {
    const makeFetch = getNativeFetchImplementation();
    const sidecarUrlObject: URL = new URL(sidecarUrl);
    const host: string = sidecarUrlObject?.hostname;
    const port: string = sidecarUrlObject?.port;
    const clearEventsUrl: string = `http://${host}:${port}/clear`;
    makeFetch(clearEventsUrl, {
      method: 'DELETE',
      mode: 'cors',
    }).catch(err => {
      console.error(
        `Sentry SDK can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/`,
        err,
      );
      return;
    });

    setEvents({ action: 'RESET', e: [] });
    sentryDataCache.resetData();
    navigate('/errors');
    setIntegrationData({});
    setReloadSpotlight(prev => prev + 1);
  };

  useEffect(() => {
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

    const onNavigate = (e: CustomEvent<string>) => {
      log('Navigate');
      navigate(e.detail);
    };

    spotlightEventTarget.addEventListener('open', onOpen as EventListener);
    spotlightEventTarget.addEventListener('close', onClose);
    spotlightEventTarget.addEventListener('navigate', onNavigate as EventListener);
    spotlightEventTarget.addEventListener('sentry:clearEvents', clearEvents as EventListener);

    return () => {
      spotlightEventTarget.removeEventListener('open', onOpen as EventListener);
      spotlightEventTarget.removeEventListener('close', onClose);
      spotlightEventTarget.removeEventListener('navigate', onNavigate as EventListener);
      spotlightEventTarget.removeEventListener('sentry:clearEvents', clearEvents as EventListener);
    };
  }, [spotlightEventTarget, navigate]);

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

  log('Integration data:', integrationData);

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
      />
    </>
  );
}
