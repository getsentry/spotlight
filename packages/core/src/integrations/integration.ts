// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Integration<T = any> = {
  /**
   * Name of the integration
   */
  name: string;

  /**
   * The content-type http headers determining which events dispatched to spotlight
   * events should be forwarded to this integration.
   *
   * For example: ["application/x-sentry-envelope"]
   */
  forwardedContentType?: string[];

  /**
   * A function returning an array of tabs to be displayed in the UI.
   */
  tabs?: TabsCreationFunction<T>;

  /**
   * Setup hook called when Spotlight is initialized.
   *
   * Use this hook to setup any global state, instrument handlers, etc.
   */
  setup?: () => void | Promise<void>;

  /**
   * Hook called whenever spotlight forwards a new raw event to this integration.
   * Use this hook to process and convert the raw request payload (string) to a
   * data structure that your integration works with in the UI.
   * The returned object will be passed to your tabs.
   */
  processEvent?: (eventContext: RawEventContext) => T | Promise<T>;
};

export type IntegrationTab<T> = {
  /**
   * Id of the tab. This needs to be a unique name.
   */
  id: string;

  /**
   * Title of the tab. This is what will be displayed in the UI.
   */
  title: string;

  /**
   * If this property is set, a count badge will be displayed
   * next to the tab title with the specified value.
   */
  notificationCount?: number;

  /**
   * JSX content of the tab. Go crazy, this is all yours!
   */
  content?: React.ComponentType<{
    integrationData: IntegrationData<T>;
  }>;

  onSelect?: () => void;

  // TODO: I don't think this should be user-facing
  active?: boolean;
};

type IntegrationData<T> = Record<string, T[]>;

type TabsContext<T> = {
  integrationData: IntegrationData<T>;
};

type TabsCreationFunction<T> = (context: TabsContext<T>) => IntegrationTab<T>[];

type RawEventContext = {
  /**
   * The content-type header of the event
   */
  contentType: string;

  /**
   * The raw data in string form of the request.
   * Use this function to parse and process the raw data it to whatever data structure
   * you expect for the given `contentType`.
   *
   * Return the processed object or undefined if the event should be ignored.
   */
  data: string;

  /**
   * Calling this function will tell spotlight that the processed event is a severe
   * event that should be highlighted in the general UI.
   *
   * For instance, this will have an effect on the Spotlight trigger button's counter appearance.
   */
  markEventSevere: () => void;
};

// export type IntegrationParameter = Array<Integration<unknown>>;

export async function initIntegrations(integrations?: Integration[]): Promise<Integration[]> {
  if (!integrations) {
    return [];
  }

  const initializedIntegrations: Integration[] = [];
  // iterate over integrations and call their hooks
  for (const integration of integrations) {
    if (Array.isArray(integration)) {
      initializedIntegrations.push(...(await initIntegrations(integration)));
    } else if (integration) {
      if (integration.setup) {
        await integration.setup();
      }
      initializedIntegrations.push(integration);
    }
  }

  return initializedIntegrations;
}
