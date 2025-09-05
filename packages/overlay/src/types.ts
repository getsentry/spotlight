export type ExperimentName = "sentry:focus-local-events";

export type ExperimentsConfig = Record<ExperimentName, boolean>;

export type NotificationCount = {
  /**
   * Numbers of notifications
   */
  count: number;

  /**
   * Indicating that among the notification count, there's at least one severe notification.
   * (This has impact on the UI, e.g. the notification count badge will be red)
   */
  severe?: boolean;
};

export type RawEventContext = {
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
  data: string | Uint8Array;
};

export type TabPanel<T> = {
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
  notificationCount?: NotificationCount;

  /**
   * JSX content of the tab. Go crazy, this is all yours!
   */
  content?: React.ComponentType<{
    processedEvents: T[];
  }>;

  onSelect?: () => void;

  /**
   * A function returning an array of panels to be displayed in the UI as children of the
   * parent panel.
   *
   * @param context contains the processed events for the panels. Use this information to
   * e.g. update the notification count badge of the panel.
   */
  panels?: (context: { processedEvents: T[] }) => TabPanel<T>[];
};

export type WindowWithSpotlight = Window & {
  __spotlight?: {
    eventTarget?: EventTarget;
  };
};

export type SpotlightContext = {
  experiments: ExperimentsConfig;
  sidecarUrl: string;
};
