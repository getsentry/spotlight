import type { Integration  } from "../integration";

export default {
    name: "sentry",
    version: "1.0.0",
    hooks: {
        "event": (payload: any) => {
            console.log("sentry event", payload);
        },
        "envelope": (payload: any) => {
            console.log("sentry envelope", payload);
        }
    }
} as Integration;