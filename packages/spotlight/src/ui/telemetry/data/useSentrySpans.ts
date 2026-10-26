import { useContext } from "react";
import { getSpans } from "../../../telemetry/selectors/spans.ts";
import useSentryStore from "../store";
import { SentryEventsContext } from "./sentryEventsContext";

export function useSentryTraces() {
  useContext(SentryEventsContext);
  const { getTraces } = useSentryStore();
  return getTraces().sort((a, b) => b.start_timestamp - a.start_timestamp);
}

export const useSentrySpans = () => {
  const allTraces = useSentryTraces();
  return getSpans(allTraces);
};

export const useSentrySpanCounts = () => {
  const spans = useSentrySpans();

  return {
    allSpans: spans.length,
  };
};
