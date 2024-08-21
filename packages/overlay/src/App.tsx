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
  skipSidecar = false,
}: AppProps) {
  const [integrationData, setIntegrationData] = useState<IntegrationData<unknown>>({});
  const [isOnline, setOnline] = useState(false);
  const [triggerButtonCount, setTriggerButtonCount] = useState<NotificationCount>({ count: 0, severe: false });
  const [isOpen, setOpen] = useState(openOnInit);
  log('App rerender', integrationData, isOnline, triggerButtonCount, isOpen);

  // Map that holds the information which kind of content type should be dispatched to which integration(s)
  const contentTypeToIntegrations = useMemo(() => {
    const result = new Map<string, Integration[]>();
    for (const integration of integrations) {
      if (!integration.forwardedContentType) continue;

      for (const contentType of integration.forwardedContentType) {
        let integrationsForContentType = result.get(contentType);
        if (!integrationsForContentType) {
          integrationsForContentType = [];
          result.set(contentType, integrationsForContentType);
        }
        integrationsForContentType.push(integration);
      }
    }
    return result;
  }, [integrations]);

  useEffect(
    () =>
      skipSidecar
        ? () => {}
        : (connectToSidecar(sidecarUrl, contentTypeToIntegrations, setIntegrationData, setOnline) as () => undefined),
    [sidecarUrl, contentTypeToIntegrations, skipSidecar],
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
      if (skipSidecar) {
        return;
      }

      const { origin } = new URL(sidecarUrl);
      const clearEventsUrl: string = `${origin}/clear`;

      try {
        await fetch(clearEventsUrl, {
          method: 'DELETE',
          mode: 'cors',
        });
      } catch (err) {
        console.error(
          `Spotlight can't connect to Sidecar - is it running? See: https://spotlightjs.com/sidecar/npx/`,
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

    return { clearEvents, onOpen, onClose, onNavigate, onToggle };
  }, [integrations, navigate, sidecarUrl, skipSidecar]);

  useKeyPress(['ctrlKey', 'F12'], eventHandlers.onToggle);

  useEffect(() => {
    log('useEffect: Adding event listeners');
    spotlightEventTarget.addEventListener('open', eventHandlers.onOpen as EventListener);
    spotlightEventTarget.addEventListener('close', eventHandlers.onClose);
    spotlightEventTarget.addEventListener('navigate', eventHandlers.onNavigate as EventListener);
    spotlightEventTarget.addEventListener('clearEvents', eventHandlers.clearEvents as EventListener);

    return (): undefined => {
      log('useEffect[destructor]: Removing event listeners');
      spotlightEventTarget.removeEventListener('open', eventHandlers.onOpen as EventListener);
      spotlightEventTarget.removeEventListener('close', eventHandlers.onClose);
      spotlightEventTarget.removeEventListener('navigate', eventHandlers.onNavigate as EventListener);
      spotlightEventTarget.removeEventListener('clearEvents', eventHandlers.clearEvents as EventListener);
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
        skipSidecar={skipSidecar}
        showClearEventsButton={showClearEventsButton}
      />
    </>
  );
}
