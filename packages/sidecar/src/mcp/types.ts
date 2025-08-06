import type { z } from "zod";
import type { EventSchema } from "./utils.js";

export type Event = z.infer<typeof EventSchema>;
