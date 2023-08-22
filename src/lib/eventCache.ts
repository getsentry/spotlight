import { SentryEvent } from "~/types";

function generate_uuidv4() {
  let dt = new Date().getTime();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let rnd = Math.random() * 16; //random number in range 0 to 16
    rnd = (dt + rnd) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === "x" ? rnd : (rnd & 0x3) | 0x8).toString(16);
  });
}

type SubscriptionCallback = (event: SentryEvent) => void;

class EventCache {
  events: SentryEvent[];
  subscribers: Map<string, SubscriptionCallback>;

  constructor(
    initial: (SentryEvent & {
      event_id?: string;
    })[] = []
  ) {
    this.events = [];
    this.subscribers = new Map<string, SubscriptionCallback>();

    initial.forEach((e) => this.push(e));
  }

  push(
    event: SentryEvent & {
      event_id?: string;
    }
  ) {
    if (!event.event_id) event.event_id = generate_uuidv4();
    this.events.push(event);
    this.subscribers.forEach((s) => s(event));
  }

  values() {
    return [...this.events];
  }

  filter(type: "error" | "transaction") {
    return this.events.filter((e) => {
      switch (type) {
        case "error":
          return "exception" in e;
        case "transaction":
          return e.type === "transaction";
        default:
          return false;
      }
    });
  }

  subscribe(cb: SubscriptionCallback) {
    const id = generate_uuidv4();
    this.subscribers.set(id, cb);

    return () => {
      this.subscribers.delete(id);
    };
  }
}

export default new EventCache();
