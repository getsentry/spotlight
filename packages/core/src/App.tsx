import { useEffect, useState } from 'react';
import Debugger from './components/Debugger';
import Trigger from './components/Trigger';
import type { Integration, IntegrationData } from './integrations/integration';
import { connectToSidecar } from './sidecar';
import { TriggerButtonCount } from './types';

type AppProps = {
  eventTarget: EventTarget;
  fullScreen?: boolean;
  showTriggerButton?: boolean;
  defaultEventId?: string;
  integrations?: Integration[];
  sidecar: string;
};
export default function App({
  eventTarget,
  fullScreen = false,
  showTriggerButton = true,
  defaultEventId,
  integrations = [],
  sidecar,
}: AppProps) {
  console.log('[Spotlight] App rerender');

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
      console.log('[Spotlight] useeffect cleanup');
      cleanupListeners();
    };
  }, [integrations, sidecar]);

  eventTarget.addEventListener('open', () => {
    setOpen(true);
  });

  eventTarget.addEventListener('close', () => {
    setOpen(false);
  });

  useEffect(() => {
    if (!isOpen) {
      eventTarget.dispatchEvent(new CustomEvent('closed'));
    }
  }, [isOpen, eventTarget]);

  console.log('[Spotlight] Integrations', integrationData);

  return (
    <>
      {showTriggerButton && <Trigger isOpen={isOpen} setOpen={setOpen} count={triggerButtonCount} />}
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
