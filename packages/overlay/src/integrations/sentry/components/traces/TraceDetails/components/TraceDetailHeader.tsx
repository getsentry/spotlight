import { Trace } from '~/integrations/sentry/types';
import TraceIcon from '../../TraceIcon';

type TraceDetailHeaderProps = {
  trace: Trace;
};

export default function TraceDetailHeader({ trace }: TraceDetailHeaderProps) {
  return (
    <div className="border-b-primary-700 bg-primary-950 flex items-center gap-x-2 border-b px-6 py-4">
      <TraceIcon trace={trace} />
      <h1 className="max-w-full flex-1 truncate text-2xl">{trace.rootTransactionName}</h1>
    </div>
  );
}
