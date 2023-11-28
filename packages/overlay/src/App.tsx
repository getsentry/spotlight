import { useEffect, useState } from 'react';
import Debugger from './components/Debugger';
import Trigger, { type Anchor } from './components/Trigger';
import type { Integration, IntegrationData } from './integrations/integration';
import { getSpotlightEventTarget } from './lib/eventTarget';
import { log } from './lib/logger';
import { connectToSidecar } from './sidecar';
import { TriggerButtonCount } from './types';

type AppProps = {
  fullScreen?: boolean;
  showTriggerButton?: boolean;
  defaultEventId?: string;
  integrations?: Integration[];
  sidecar: string;
  anchor?: Anchor;
};

export default function App({
  fullScreen = false,
  showTriggerButton = true,
  defaultEventId,
  integrations = [],
  sidecar,
  anchor,
}: AppProps) {
  log('App rerender');

  const [integrationData, setIntegrationData] = useState<IntegrationData<unknown>>({});
  const [isOnline, setOnline] = useState(false);
  const [triggerButtonCount, setTriggerButtonCount] = useState<TriggerButtonCount>({ general: 0, severe: 0 });
  const [isOpen, setOpen] = useState(fullScreen);

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

    const cleanupListeners = connectToSidecar(
      sidecar,
      contentTypeToIntegrations,
      setIntegrationData,
      setOnline,
      setTriggerButtonCount,
    );

    return () => {
      log('useEffect cleanup');
      cleanupListeners();
    };
  }, [integrations, sidecar]);

  const spotlightEventTarget = getSpotlightEventTarget();

  useEffect(() => {
    const onOpen = () => {
      log('Open');
      setOpen(true);
    };

    const onClose = () => {
      log('Close');
      setOpen(false);
    };

    spotlightEventTarget.addEventListener('open', onOpen);
    spotlightEventTarget.addEventListener('close', onClose);

    return () => {
      spotlightEventTarget.removeEventListener('open', onOpen);
      spotlightEventTarget.removeEventListener('close', onClose);
    };
  }, [spotlightEventTarget]);

  useEffect(() => {
    if (!isOpen) {
      spotlightEventTarget.dispatchEvent(new CustomEvent('closed'));
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [isOpen, spotlightEventTarget]);

  log('Integrations', integrationData);

  return (
    <>
      {showTriggerButton && <Trigger isOpen={isOpen} setOpen={setOpen} count={triggerButtonCount} anchor={anchor} />}
      <Debugger
        isOpen={isOpen}
        setOpen={setOpen}
        isOnline={isOnline}
        defaultEventId={defaultEventId}
        integrations={integrations}
        integrationData={integrationData}
      />
    </>
  );
}
