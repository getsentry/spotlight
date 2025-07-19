import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Debugger from "./components/Debugger";
import Trigger from "./components/Trigger";
import { SPOTLIGHT_OPEN_CLASS_NAME } from "./constants";
import type { Integration, IntegrationData } from "./integrations/integration";
import { getPanelsFromIntegrations } from "./integrations/utils/extractPanelsFromIntegrations";
import { base64Decode } from "./lib/base64";
import * as db from "./lib/db";
import { getSpotlightEventTarget } from "./lib/eventTarget";
import { log } from "./lib/logger";
import useKeyPress from "./lib/useKeyPress";
import { getRouteStorageKey } from "./overlay/utils/routePersistence";
import { connectToSidecar } from "./sidecar";
import type { NotificationCount, SpotlightOverlayOptions } from "./types";

type AppProps = Omit<SpotlightOverlayOptions, "debug" | "injectImmediately"> &
  Required<Pick<SpotlightOverlayOptions, "sidecarUrl">>;

type EventData = { contentType: string; data: string | Uint8Array };

const processEvent = (contentType: string, event: { data: string | Uint8Array }, integration: Integration) =>
  integration.processEvent
    ? integration.processEvent({
        contentType,
        data: event.data,
      })
    : { event };

function processInitialEvents(
  integrations: Integration[],
  initialEvents: Record<string, (string | Uint8Array)[]>,
): IntegrationData<unknown> {
  const result: IntegrationData<unknown> = {};

  for (const integration of integrations) {
    result[integration.name] = [];

    for (const contentType in initialEvents) {
      const contentTypeBits = contentType.split(";");
      const contentTypeWithoutEncoding = contentTypeBits[0];

      if (!integration.forwardedContentType?.includes(contentTypeWithoutEncoding)) {
        continue;
      }

      const shouldUseBase64 = contentTypeBits[contentTypeBits.length - 1] === "base64";

      for (const data of initialEvents[contentTypeWithoutEncoding]) {
        const processedEvent = processEvent(
          contentTypeWithoutEncoding,
          { data: shouldUseBase64 ? base64Decode(data as string) : data },
          integration,
        );
        if (processedEvent) {
          result[integration.name].push(processedEvent);
        }
      }
    }
  }

  return result;
}

export default function App({
  openOnInit = false,
  showTriggerButton = true,
  integrations = [],
  sidecarUrl,
  anchor,
  fullPage = false,
  showClearEventsButton = true,
  initialEvents = {},
}: AppProps) {
  const [integrationData, setIntegrationData] = useState<IntegrationData<unknown>>(() =>
    processInitialEvents(integrations, initialEvents),
  );
  const [isOnline, setOnline] = useState(false);
  const [triggerButtonCount, setTriggerButtonCount] = useState<NotificationCount>({ count: 0, severe: false });
  const [isOpen, setOpen] = useState(openOnInit);
  log("App rerender", integrationData, isOnline, triggerButtonCount, isOpen);

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

    const result: Record<string, (event: { data: string | Uint8Array }) => void> = Object.create(null);
    for (const [contentType, integrations] of contentTypeToIntegrations.entries()) {
      const listener = (event: { data: string | Uint8Array }): void => {
        log(`Received new ${contentType} event`);
        for (const integration of integrations) {
          const newIntegrationData = processEvent(contentType, event, integration);

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

      log("Adding listener for", contentType);

      // `contentType` could for example be "application/x-sentry-envelope"
      result[contentType] = listener;
      result[`${contentType};base64`] = ({ data }) => listener({ data: base64Decode(data as string) });
    }
    return result;
  }, [integrations]);

  useEffect(
    () => connectToSidecar(sidecarUrl, contentTypeListeners, setOnline) as () => undefined,
    [sidecarUrl, contentTypeListeners],
  );

  const spotlightEventTarget = useMemo(() => getSpotlightEventTarget(), []);

  const dispatchToContentTypeListener = useCallback(
    ({ contentType, data }: EventData) => {
      const contentTypeBits = contentType.split(";");
      const contentTypeWithoutEncoding = contentTypeBits[0];

      const listener = contentTypeListeners[contentTypeWithoutEncoding];
      if (!listener) {
        log("Got event for unknown content type:", contentTypeWithoutEncoding);
        return;
      }
      if (contentTypeBits[contentTypeBits.length - 1] === "base64") {
        listener({ data: base64Decode(data as string) });
      } else {
        listener({ data });
      }
    },
    [contentTypeListeners],
  );

  useEffect(() => {
    // Populate from DB
    db.getEntries().then(entries => {
      for (const detail of entries as EventData[]) {
        dispatchToContentTypeListener(detail);
      }
    });
  }, [dispatchToContentTypeListener]);

  // Note that `useNavigate()` relies on `useLocation()` which
  // causes a full re-render here every time we change the location
  // We can fix this by doing `const router = createMemoryRouter()`
  // and using `router.navigate()` but that requires a larger refactor
  // as our <Route>s are scattered around a bit
  // See https://github.com/remix-run/react-router/issues/7634
  const navigate = useNavigate();
  const location = useLocation();

  // contextId for namespacing of routes in sessionStorage
  const contextId = sidecarUrl || (typeof window !== "undefined" ? window.location.origin : "default");

  // helper to get valid panel routes
  const getValidRoutes = () => {
    return getPanelsFromIntegrations(integrations, integrationData).map(panel => `/${panel.id}`);
  };

  const clearEvents = useCallback(async () => {
    try {
      const clearEventsUrl: string = new URL("/clear", sidecarUrl).href;

      await db.reset();
      await fetch(clearEventsUrl, {
        method: "DELETE",
        mode: "cors",
      });
    } catch (err) {
      console.error(`Spotlight can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/`, err);
      return;
    }

    for (const integration of integrations) {
      setIntegrationData(prev => ({ ...prev, [integration.name]: [] }));
      if (integration.reset) integration.reset();
    }
  }, [integrations, sidecarUrl]);

  const onOpen = useCallback(
    (
      e: CustomEvent<{
        path: string | undefined;
      }>,
    ) => {
      log("Open");
      setOpen(true);
      if (e.detail.path) {
        navigate(e.detail.path);
      } else {
        try {
          const lastRoute = sessionStorage.getItem(getRouteStorageKey(contextId));
          const validRoutes = getValidRoutes();
          if (lastRoute && validRoutes.includes(lastRoute) && lastRoute !== location.pathname) {
            navigate(lastRoute);
          }
        } catch {
          // ignore storage errors
        }
      }
    },
    [navigate, location.pathname, contextId, integrationData, integrations],
  );

  const onClose = useCallback(() => {
    log("Close");
    setOpen(false);
  }, []);

  const onToggle = useCallback(() => {
    log("Toggle");
    setOpen(prev => !prev);
  }, []);

  const onNavigate = useCallback(
    (e: CustomEvent<string>) => {
      log("Navigate");
      navigate(e.detail);
    },
    [navigate],
  );

  const onEvent = useCallback(
    ({ detail }: CustomEvent<EventData>) => {
      dispatchToContentTypeListener(detail);
      db.add(detail);
    },
    [dispatchToContentTypeListener],
  );

  useKeyPress("F12", ["ctrlKey"], onToggle);

  useEffect(() => {
    log("useEffect: Adding event listeners");
    spotlightEventTarget.addEventListener("open", onOpen as EventListener);
    spotlightEventTarget.addEventListener("close", onClose);
    spotlightEventTarget.addEventListener("navigate", onNavigate as EventListener);
    spotlightEventTarget.addEventListener("clearEvents", clearEvents as EventListener);
    spotlightEventTarget.addEventListener("event", onEvent as EventListener);

    return (): undefined => {
      log("useEffect[destructor]: Removing event listeners");
      spotlightEventTarget.removeEventListener("open", onOpen as EventListener);
      spotlightEventTarget.removeEventListener("close", onClose);
      spotlightEventTarget.removeEventListener("navigate", onNavigate as EventListener);
      spotlightEventTarget.removeEventListener("clearEvents", clearEvents as EventListener);
      spotlightEventTarget.removeEventListener("event", onEvent as EventListener);
    };
  }, [spotlightEventTarget, onOpen, onClose, onNavigate, clearEvents, onEvent]);

  useEffect(() => {
    if (!isOpen) {
      spotlightEventTarget.dispatchEvent(new CustomEvent("closed"));
      document.body.classList.remove(SPOTLIGHT_OPEN_CLASS_NAME);
    } else {
      spotlightEventTarget.dispatchEvent(new CustomEvent("opened"));
      document.body.classList.add(SPOTLIGHT_OPEN_CLASS_NAME);
    }
  }, [isOpen, spotlightEventTarget]);

  useEffect(() => {
    if (triggerButtonCount.severe) {
      spotlightEventTarget.dispatchEvent(
        new CustomEvent("severeEventCount", { detail: { count: triggerButtonCount.count } }),
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
        // Pass contextId to Overview
        contextId={contextId}
      />
    </>
  );
}
