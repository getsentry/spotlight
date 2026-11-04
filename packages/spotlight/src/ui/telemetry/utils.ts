import { removeURLSuffix } from "@spotlight/ui/lib/removeURLSuffix";
import { log } from "../lib/logger";
import { setTelemetrySidecarUrl } from "./store/store";

export function setSidecarUrlInStore(url: string) {
  const baseSidecarUrl = removeURLSuffix(url, "/stream");
  setTelemetrySidecarUrl(baseSidecarUrl);
  log("Set sidecar URL for telemetry:", baseSidecarUrl);
}
