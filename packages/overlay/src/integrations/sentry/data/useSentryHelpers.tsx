import { useContext } from 'react';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryHelpers = () => {
  useContext(SentryEventsContext);
  const { projectId } = useSpotlightContext();

  return {
    isEventLocalToSession: (eventProjectId: string) => {
      return eventProjectId === projectId;
    },
    isTraceLocalToSession: (traceProjectIds: Set<string>) => {
      return traceProjectIds.has(projectId);
    },
  };
};
