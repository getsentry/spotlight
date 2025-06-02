import { useContext } from "react";
import useSentryStore from "../store";
import { isLocalTrace } from "../store/helpers";
import type { Trace } from "../types";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryEnvelopes = () => {
  useContext(SentryEventsContext);

  const getEnvelopes = useSentryStore(state => state.getEnvelopes);

  const allEnvelopes = getEnvelopes().sort((a, b) => {
    const a_sent_at = a.envelope[0].sent_at as string;
    const b_sent_at = b.envelope[0].sent_at as string;
    if (a_sent_at < b_sent_at) return 1;
    if (a_sent_at > b_sent_at) return -1;
    return 0;
  });

  const localEnvelopes = allEnvelopes.filter(({ envelope }) => {
    const trace_id = (envelope[0]?.trace as Trace)?.trace_id;
    if (trace_id) return isLocalTrace(trace_id) !== false;
    return true;
  });

  return { allEnvelopes, localEnvelopes };
};
