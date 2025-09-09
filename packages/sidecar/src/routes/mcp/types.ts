import type { z } from "zod";
import type { EventSchema } from "./schema.js";

export type Event = z.infer<typeof EventSchema>;
