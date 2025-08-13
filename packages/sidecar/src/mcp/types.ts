import type { z } from "zod";
import type { EventSchema } from "./schema.js";

export type Event = z.infer<typeof EventSchema>;

export type ErrorEventFilter = {
  eventId?: string;
};
