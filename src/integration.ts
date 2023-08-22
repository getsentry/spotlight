import type { EventProcessor, Integration } from "@sentry/types";
import eventCache from "./lib/eventCache";

export default class SpotlightIntegration implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = "Spotlight";

  /**
   * @inheritDoc
   */
  public name: string;

  public constructor() {
    this.name = SpotlightIntegration.id;
  }

  /**
   * @inheritDoc
   */
  public setupOnce(
    addGlobalEventProcessor: (callback: EventProcessor) => void
  ): void {
    const eventProcessor: EventProcessor = (currentEvent: any) => {
      eventCache.push(currentEvent);

      return currentEvent;
    };
    eventProcessor.id = this.name;
    addGlobalEventProcessor(eventProcessor);
  }
}
