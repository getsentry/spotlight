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
   * Array of tabs to be displayed in the Spotlight UI
   */
  tabs?: IntegrationTab<T>[];

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
   */
  processEvent?: (event: RawEvent) => T | Promise<T>;
};

export type IntegrationTab<T> = {
  /**
   * Name of the tab. This needs to be a unique name.
   * TODO: Add a second property tabTitle so that we can distinguish between
   */
  name: string;

  /**
   * The number of events that should be displayed next to the tab's title.
   */
  count?: number;

  /**
   * JSX content of the tab. Go crazy, this is all yours!
   */
  content?: React.ComponentType<{
    integrationData: Record<string, T[]>;
  }>;

  // TODO: I don't think these should be user-facing, right?
  onSelect?: () => void;
  active?: boolean;
};

type RawEvent = {
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
