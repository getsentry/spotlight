import { useContext } from "react";
import useSentryStore from "../store";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryEnvelopes = () => {
  useContext(SentryEventsContext);

  const getEnvelopes = useSentryStore(state => state.getEnvelopes);

  const allEnvelopes = getEnvelopes().sort((a, b) => {
    const a_sent_at = a[0].sent_at as string;
    const b_sent_at = b[0].sent_at as string;
    if (a_sent_at < b_sent_at) return 1;
    if (a_sent_at > b_sent_at) return -1;
    return 0;
  });

  return allEnvelopes;
};
