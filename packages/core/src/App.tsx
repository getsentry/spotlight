import { useEffect, useState } from 'react';
import Debugger from './components/Debugger';
import Trigger from './components/Trigger';
import type { Integration } from './integrations/integration';
import { connectToSidecar } from './sidecar';
import { TriggerButtonCount } from './types';

const DEFAULT_SIDECAR = 'http://localhost:8969/stream';

export default function App({
  eventTarget,
  fullScreen = false,
  showTriggerButton = true,
  defaultEventId,
  integrations = [],
}: {
  eventTarget: EventTarget;
  fullScreen?: boolean;
  showTriggerButton?: boolean;
  defaultEventId?: string;
  integrations?: Integration[];
}) {
  console.log('[Spotlight] App rerender');

  const [integrationData, setIntegrationData] = useState<Record<string, Array<unknown>>>({});
  const [isOnline, setOnline] = useState(false);
  const [triggerButtonCount, setTriggerButtonCount] = useState<TriggerButtonCount>({ general: 0, severe: 0 });

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
      DEFAULT_SIDECAR,
      contentTypeToIntegrations,
      setIntegrationData,
      setOnline,
      setTriggerButtonCount,
    );

    return () => {
      console.log('[Spotlight] useeffect cleanup');
      cleanupListeners();
    };
  }, []);

  const [isOpen, setOpen] = useState(fullScreen);

  eventTarget.addEventListener('toggle', () => {
    setOpen(!isOpen);
  });

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
