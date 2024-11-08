import EventList from '../../../events/EventList';

type TraceErrorsProps = { traceId: string };

export default function TraceErrors({ traceId }: TraceErrorsProps) {
  return <EventList traceId={traceId} />;
}
